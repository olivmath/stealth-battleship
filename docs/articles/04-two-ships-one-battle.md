# Devlog: ZK Battleship

## Part 4 — "Two ships, one battle"

*Connecting two players in real time, surviving race conditions, and the 33-turn E2E test*

---

### The challenge that seemed simple

ZK circuits? Ready. On-chain verification? Working. Now all that was left was the "game" — making two players find each other and play Battleship in real time.

Seems like the most trivial part, right? After all, it's "just" a WebSocket server that manages turns. Except that each action from each player involves a cryptographic proof, each response needs to be verified, and either player can disconnect at any moment.

---

### The stack: Express + Socket.io

The backend is an Express server with Socket.io for real-time communication via WebSocket.

```
backend/src/
  auth/          # Ed25519 authentication
  matchmaking/   # Queue, friend match, room management
  battle/        # Turn logic, attack, result, victory
  soroban/       # Adapter for on-chain transactions
  ws/            # WebSocket server, rate limit, reconnection
  shared/        # Supabase, circuits, persistence
```

The choice of Socket.io over raw WebSocket was practical: it handles automatic reconnection, rooms, and fallback to HTTP long-polling when WebSocket isn't available.

---

### Authentication: Ed25519 without a wallet

An important decision: not using a Stellar wallet for game authentication. Instead, each player generates an Ed25519 key pair locally. When connecting to the server, they sign a challenge with their private key:

```typescript
// Client: signs the handshake
export function signAuth(keys, timestamp, nonce) {
    const message = `${keys.publicKeyHex}:${timestamp}:${nonce}`;
    const msgBytes = new TextEncoder().encode(message);
    const sig = nacl.sign.detached(msgBytes, keys.fullSecretKey);
    return { publicKey: keys.publicKeyHex, timestamp, nonce, signature };
}
```

The server verifies the signature in the Socket.io middleware:

```typescript
io.use((socket, next) => {
    const auth = socket.handshake.auth;
    const result = verifyAuth(auth);
    if (!result.valid) return next(new Error('Auth failed'));
    socket.data.publicKey = result.publicKey;
    next();
});
```

Every action during the game (attack, response, reveal) is also signed. If the server receives an action with an invalid signature, it silently rejects it. This prevents anyone from faking another player's actions.

---

### Matchmaking: finding the opponent

Two modes: random and friend.

**Random:** the player joins a queue. When another player with the same grid size joins, they're paired automatically.

```typescript
export function findRandomMatch(publicKey, socketId, gridSize) {
    // Already in a match?
    if (playerToMatch.has(publicKey)) return { type: 'already_in_match' };

    // Find a compatible opponent in the queue
    const idx = matchQueue.findIndex(
        e => e.gridSize === gridSize && e.publicKey !== publicKey
    );

    if (idx === -1) {
        matchQueue.push({ publicKey, socketId, gridSize });
        return { type: 'queued' };
    }

    // Found one! Remove from queue and create match
    const opponent = matchQueue.splice(idx, 1)[0];
    const match = createMatch(
        { publicKey, socketId },
        { publicKey: opponent.publicKey, socketId: opponent.socketId },
        gridSize
    );
    return { type: 'matched', match };
}
```

**Friend:** one player creates the room and receives a 6-digit code. The other joins with that code.

```typescript
export function createFriendMatch(publicKey, socketId, gridSize) {
    const matchCode = generateMatchCode(); // "782336"
    const match = { id: generateId(), matchCode, status: 'waiting', ... };
    matches.set(match.id, match);
    matchCodeIndex.set(matchCode, match.id);
    return { matchId: match.id, matchCode };
}
```

Simple on paper. In practice? A bug factory.

---

### The avalanche of race conditions

When two players are connected via WebSocket and performing simultaneous actions, everything that can go wrong does.

**Bug 1: duplicate queue entries.**
A player clicked "find match" twice quickly. Entered the queue twice. When paired with someone, the second entry became orphaned, preventing the player from joining another match.

```typescript
// Fix: check if already in queue
const alreadyQueued = matchQueue.some(e => e.publicKey === publicKey);
if (alreadyQueued) return { type: 'queued' };
```

Commit `bb19cd9`: `fix(backend): prevent state conflicts in matchmaking interactor`

**Bug 2: player finished a match but couldn't start another.**
The `playerToMatch` mapped publicKey -> matchId, but wasn't cleaned up when the match ended. The player was "stuck" in a ghost match.

```typescript
// Fix: clean up on endMatch
export function endMatch(match, winnerKey, reason) {
    if (match.player1) playerToMatch.delete(match.player1.publicKey);
    if (match.player2) playerToMatch.delete(match.player2.publicKey);
    match.status = 'finished';
}
```

Commit `5289564`: `fix(backend): clear playerToMatch on match end for immediate re-queue`

**Bug 3: rate limit persisting between turns.**
I added a rate limit of 1 attack per second to prevent spam. But the cooldown didn't reset between turns — so the player attacked, waited for the response, and when it was their turn again, the cooldown was still active from the previous turn.

```typescript
// Fix: reset rate limit when the turn starts
function emitTurnStart(io, match) {
    const activeSocketId = match.currentTurn === match.player1.publicKey
        ? match.player1.socketId : match.player2.socketId;
    resetRateLimit(activeSocketId);
    // ...
}
```

Commit `318fd02`: `fix(backend): reset rate limit on turn start to prevent cross-turn cooldown`

---

### The flow of a complete match

With the bugs fixed, the flow of a PvP match looked like this:

```
Client A                     Backend                      Client B
    |  connect + auth Ed25519    |                           |
    |-------------------------->|                           |
    |                           |   connect + auth Ed25519  |
    |                           |<--------------------------|
    |                           |                           |
    |  create_friend             |                           |
    |-------------------------->|                           |
    |  <- matchCode: 782336     |                           |
    |                           |   join_friend(782336)     |
    |                           |<--------------------------|
    |  match_found              |          match_found      |
    |<--------------------------|-------------------------->|
    |                           |                           |
    |  placement(hash + proof)  |                           |
    |-------------------------->|  verify board_validity    |
    |                           |   <- 728ms                |
    |                           |  placement(hash + proof)  |
    |                           |<--------------------------|
    |                           |  verify board_validity    |
    |                           |   <- 722ms                |
    |  both_ready               |          both_ready       |
    |<--------------------------|-------------------------->|
    |                           |                           |
    |                           |  [Soroban: verify_board x2
    |                           |   + open_match]           |
    |                           |                           |
    |  attack(0,0)              |                           |
    |-------------------------->|  incoming_attack(0,0)     |
    |                           |-------------------------->|
    |                           |  shot_result(hit + proof) |
    |                           |<--------------------------|
    |                           |  verify shot_proof        |
    |                           |   <- 200ms                |
    |  result_confirmed(hit)    |                           |
    |<--------------------------|  turn_start(next)         |
    |                           |-------------------------->|
    |                           |                           |
    |        ... 33 turns ...   |                           |
    |                           |                           |
    |  game_over(winner: A)     |   game_over(winner: A)    |
    |<--------------------------|-------------------------->|
    |                           |                           |
    |  reveal(ships + nonce)    |                           |
    |-------------------------->|                           |
    |                           |  reveal(ships + nonce)    |
    |                           |<--------------------------|
    |                           |  generate turns_proof     |
    |                           |   <- 11.7s                |
    |  turns_proof              |          turns_proof      |
    |<--------------------------|-------------------------->|
    |                           |                           |
    |                           |  [Soroban: close_match]   |
```

Each `shot_proof` is verified in ~200ms. The final `turns_proof` takes ~12 seconds to generate on the server (it's a large circuit — 100 attacks per player).

---

### Disconnection and grace period

What if a player disconnects mid-match? They can't lose automatically — maybe it's a momentary connection drop. But they also can't wait forever.

Solution: 60-second grace period.

```typescript
socket.on('disconnect', (reason) => {
    const match = getPlayerMatch(publicKey);
    if (match && match.status === 'battle') {
        // Notify the opponent
        io.to(opponentSocketId).emit('pvp:opponent_disconnected');

        // Wait 60s
        disconnectGrace.set(publicKey, setTimeout(() => {
            // Didn't reconnect? Auto-forfeit
            endMatch(match, opponentKey, 'disconnect_timeout');
            io.to(opponentSocketId).emit('battle:game_over', {
                winner: opponentKey,
                reason: 'opponent_disconnected',
            });
        }, 60_000));
    }
});
```

If the player reconnects within 60 seconds, the grace period is canceled and the game continues normally. The socket ID is updated in the room, and the player receives a `pvp:reconnected` event with the current state.

---

### The E2E test: 33 turns, 44 seconds

The decisive moment: an end-to-end test that simulates a complete match. Two auto-generated "players", with real ZK proofs, real verification, and real on-chain submission.

```
Phase 1: Setup
  Circuits loaded (hash_helper, board_validity, shot_proof)
  Board proofs generated (P1: 14592 bytes, P2: 14592 bytes)
  Both players connected

Phase 2: Matchmaking
  Match created: 0b9aece78758d687, code: 782336
  Both joined match (10x10)

Phase 3: Placement
  Both ready! First turn: 6a144be1...

Phase 4: Battle
  Turn 5: P1 -> (0,2) hit
  Turn 9: P1 -> (0,4) hit [SUNK Carrier]
  Turn 17: P1 -> (2,3) hit [SUNK Battleship]
  Turn 23: P1 -> (4,2) hit [SUNK Cruiser]
  Turn 29: P1 -> (6,2) hit [SUNK Submarine]
  Turn 33: P1 -> (8,1) hit [SUNK Destroyer]
  Game over! Winner: Player1, reason: all_ships_sunk, turns: 33

Phase 5: Reveal & Turns Proof
  turns_proof received (29184 hex chars)

  Duration: 44.4s
  Status: ALL PASSED
```

33 turns. 17 attacks from P1, 16 from P2. 33 `shot_proof` proofs verified (~200ms each). 2 `board_validity` proofs verified (~730ms each). 1 `turns_proof` generated in 11.7 seconds. 4 Soroban transactions on testnet. All in 44 seconds.

The backend log during this test is a symphony:

```
[battle] 6a144be1... board_validity ✓ (728ms)
[battle] 0ce08348... board_validity ✓ (722ms)
[battle] Match 0b9aece78758d687 — BATTLE START
[stellar] opening match on-chain (3 txs)...
[battle] 6a144be1... attacks (0,0)
[battle] 0ce08348... shot_proof ✓ (330ms)
[battle] 0ce08348... responds: hit at (0,0)
... 31 turns ...
[battle] WIN CONDITION MET
[battle] turns_proof generated (11704ms)
[stellar] closing match on-chain sessionId=3...
[stellar] close_match confirmed
```

Everything working together. ZK, WebSocket, Soroban. In parallel — while the players attack each other, the Soroban transactions are submitted in background.

---

### Persistence: Supabase as the off-chain database

Not everything goes on-chain. Supabase stores what's operational:

| Table | What it stores |
|-------|---------------|
| `matches` | Match records (players, grid, status, winner) |
| `attacks` | History of each attack (coordinates, result, turn) |
| `player_stats` | Wins, losses, total matches per player |
| `proof_logs` | Log of each verified proof (circuit, time, valid?) |

The blockchain is the court. Supabase is the clerk's office. One guarantees the truth; the other organizes the documents.

---

### What we have so far

At the end of this phase:

- Express + Socket.io backend managing PvP matches in real time
- Ed25519 authentication on every action
- Random and friend code matchmaking
- `board_validity` and `shot_proof` verification on every action
- 60s grace period for reconnection
- `turns_proof` generation on the server after game over
- Fire-and-forget on-chain proof submission
- Complete E2E test passing (33 turns, 44s)
- Deploy on Render (free plan, Oregon region)

The machine works. But it only works because we learned several lessons along the way.

---

*Previous: [Part 3 — "The blockchain that verified the proof"](./03-proofs-onchain.md)*
*Next: [Part 5 — "The lesson that cost 214 XLM"](./05-214-xlm-lesson.md)*
