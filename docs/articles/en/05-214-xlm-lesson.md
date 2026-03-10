# Devlog: ZK Battleship

## Part 5 — "The lesson that cost 214 XLM"

*What I learned building a ZK game in 17 days, what I'd do differently, and why zero-knowledge proofs are going to change everything*

---

### The final numbers

Before reflecting, the facts:

| Metric | Value |
|--------|-------|
| Days of development | 17 |
| Total commits | 331 |
| Biggest day | February 23rd: 112 commits |
| Languages | 4 (TypeScript, Rust, Noir, HTML) |
| ZK circuits | 3 (board_validity, shot_proof, turns_proof) |
| On-chain transactions per match | 4 |
| Real cost per match | ~0.12 XLM (~$0.02) |
| Cost I thought it was | 214 XLM (~$30) |
| Proof generation time (board) | ~2s |
| Verification time (shot_proof) | ~200ms |
| Full E2E test time | 44.4s |

---

### The final architecture

After all the mistakes, pivots, and discoveries, the architecture ended up like this:

```
                    Generates ZK proofs
                    (NoirJS + bb.js WASM)
                          |
    [Web Client]   -------|
         |                |
         | Socket.io      |
         | (Ed25519)      |
         v                v
    [Express Backend] ----------> [Supabase]
         |                         (history, stats)
         |
         | 4 TXs per match
         v
    [Soroban Testnet]
         |
         |-- BattleshipContract (ours)
         |     |
         |     |-- verify_board(proof) --> VerifierContract
         |     |-- open_match(p1, p2) --> GameHub.start_game()
         |     |-- close_match(proof) --> VerifierContract
         |     |                      --> GameHub.end_game()
         |
         |-- UltraHonk Verifier (native BN254, Protocol 25)
         |-- Game Hub (Stellar ecosystem)
```

Three layers with clear responsibilities:

1. **Client**: generates ZK proofs locally (never sends ship positions)
2. **Backend**: manages PvP match, verifies proofs, submits on-chain
3. **Blockchain**: final trustless verification, immutable record

---

### The 5 lessons I'd pay to have learned sooner

#### 1. Test the riskiest integration first

I started with the single-player game. 14 beautiful screens, animations, haptics. Two weeks of polish. When I tried to integrate bb.js into React Native... it didn't run. The mobile app became single-player only, and I had to build a web client from scratch.

If I had spent 2 hours on day one testing `import { UltraHonkBackend } from '@aztec/bb.js'` on React Native, I would have gone straight to web and saved days.

**Rule: the first thing you do in a project is test the part that can kill the project.**

#### 2. Blockchain fees are dynamic — don't guess

I put 214 XLM (max u32 stroops) as the fee because "this way it won't fail". And it really didn't fail. But I also didn't know how much I was actually paying.

When I finally looked at the real costs via Horizon API:

```bash
curl "https://horizon-testnet.stellar.org/transactions/{hash}" | jq '.fee_charged'
```

I discovered that the first TX cost 5.5 XLM (cold start) and the following ones 0.03 XLM. The max fee isn't what you pay — it's the ceiling you accept. Soroban simulates the transaction and charges the real cost.

The final solution: use `minResourceFee` from the simulation:

```typescript
const simResult = await server.simulateTransaction(tx);
const minFee = simResult.minResourceFee;
console.log(`${method} real cost: ${minFee/1e7} XLM`);
```

**Rule: never ignore costs. Log, understand, optimize.**

#### 3. Sequence numbers are mutable state — be careful

I tried to optimize the fee by rebuilding the transaction with the correct value from the simulation. But `TransactionBuilder` increments the account's sequence number internally. When rebuilding, the sequence went to N+2 when the simulation expected N+1.

```
Simulated TX: sequence N+1 ✓
Rebuilt TX: sequence N+2 ✗ → ERROR
```

Seems obvious in hindsight. But at the time, I was buried in 50 lines of async code and the error was a generic "status=ERROR" with no descriptive message.

**Rule: side effects in constructors are traps. Read the SDK source code, not just the documentation.**

#### 4. ZK isn't magic — it's trade-offs

Zero-knowledge proofs are powerful, but they have clear costs:

| Aspect | Trade-off |
|--------|-----------|
| **Circuit size** | More verifications = more constraints = slower proof |
| **Fixed inputs** | Circuits don't support variable-length arrays — you define the maximum and pad the rest |
| **Generation time** | board_validity: ~2s. turns_proof: ~12s. Acceptable in a game, unfeasible in real-time |
| **Compatibility** | bb.js needs heavy WASM — doesn't run in every environment |
| **Learning curve** | Thinking in "circuits" is different from thinking in "functions" |

The `turns_proof` takes 12 seconds because it iterates 100 attacks x 5 ships x 5 cells per ship = 2,500 hit checks. Each check becomes constraints in the circuit. There's no way to "optimize" without reducing what the circuit verifies.

The decision to verify `shot_proof` only on the backend (not on-chain) was a conscious trade-off: speed in exchange for partial trust. The `turns_proof` at the end compensates — it verifies everything retroactively.

#### 5. State rent is invisible until it hurts

Soroban charges rent to keep data on-chain. Every piece of state — WASM, verification keys, variables — has a TTL. On testnet, the default TTL for Instance storage is ~5 days. When it expires, the state becomes archived. The next call has to pay for **restore**, and the cost is proportional to the data size.

Our Verifier contract loads the UltraHonk bytecode (heavy) and two verification keys. When the TTL expired, the first `verify_board` cost **5.54 XLM** instead of 0.03 XLM — 163 times more expensive.

The bug? Our contracts did `extend_ttl` on Temporary storage (MatchState, with 30-day TTL), but **didn't do it on Instance storage** — exactly where the most expensive data lives (WASM and VKs). The Instance kept the network's default TTL, and expired silently.

The fix is one line in each contract:

```rust
env.storage().instance().extend_ttl(518_400, 518_400); // 30 days
```

Adding this to `verify_board` or `open_match`, each call renews the instance TTL for another 30 days. Marginal cost: zero. Cost of not doing it: 5+ XLM every time the contract goes cold.

Analyzing the account's 202 transactions, the pattern was clear: days without use → expensive restore → cheap normal calls → days without use → cycle repeats. An `extend_ttl` would have avoided **~16 XLM** in restores during development.

**Rule: understand your blockchain's rent model before deploying. What you don't extend, the network archives.**

---

### What ZK changes in games

Beyond the technical lessons, this project showed me something broader: zero-knowledge proofs solve a fundamental problem in digital games.

In any game with hidden information — poker, Battleship, fog of war, cards in hand — someone needs to be the "trusted referee". Historically, that role falls on the server. You trust that the game server isn't cheating you. And in most casual games, that trust is acceptable.

But imagine games with real stakes. Tournaments. Money involved. Bets. Suddenly, "trusting the server" isn't acceptable anymore. You want **proofs**.

With ZK:
- The player places their ships and generates a validity proof
- Each move is accompanied by an honesty proof
- The result is verified mathematically, not by trust

Nobody needs to trust anybody. Math is the referee.

---

### Protocol 25 as the enabler

This is only economically viable because of Stellar's Protocol 25. UltraHonk proof verification depends on BN254 elliptic curve operations and Poseidon2 hashing. Before Protocol 25, doing these operations inside a smart contract would be prohibitively expensive — millions of WASM instructions.

With Protocol 25, these operations are **host functions** — executed natively by the validator. The cost drops from "impossible" to "0.05 XLM".

This opens the door not just for Battleship, but for any hidden information game: poker, Mahjong, Stratego, Cluedo, card games. Any mechanic where "I know something you don't" can be protected by ZK and verified on-chain.

---

### What I'd do differently

If I started the project today:

1. **Day 1**: test bb.js on the final target (web, mobile, or both)
2. **Day 1**: build a minimal circuit and verify on-chain on testnet
3. **Day 2**: dynamic fee from the first transaction, with logs
4. **Week 1**: functional web client with ZK, no visual polish
5. **Week 2**: real-time PvP, E2E test, deploy
6. **After**: polish, animations, i18n, mobile if possible

Instead, I made it pretty first and functional later. It worked out in the end, but barely. The 112-commit day wasn't heroic — it was the consequence of leaving the hard parts for last.

---

### The result

Stealth Battleship is a Battleship game where nobody sees the other's board, nobody trusts the server, and math guarantees nobody can cheat.

Three ZK circuits. Four on-chain transactions. Zero trust required.

All open-source at [github.com/olivmath/stealth-battleship](https://github.com/olivmath/stealth-battleship).

If you read this far and had never heard of ZK, I hope it makes sense now. It's not obscure cryptography for academics — it's a practical tool that solves real problems. And with blockchains like Stellar adding native support for these operations, the barrier to entry will only decrease.

If I — a dev who had never made a game, never written a ZK circuit, and never deployed a smart contract — managed to do this in 17 days, you can too.

The proof is on-chain. Go verify it.

---

*Previous: [Part 4 — "Two ships, one battle"](./04-two-ships-one-battle.md)*

---

### Series index

1. [The Hackathon](./01-logbook.md) — The problem and the idea
2. [Proving without showing](./02-proving-without-showing.md) — Noir, ZK circuits, and the React Native wall
3. [The blockchain that verified the proof](./03-proofs-onchain.md) — Soroban, Protocol 25, and 214 XLM in fees
4. [Two ships, one battle](./04-two-ships-one-battle.md) — Real-time PvP and race conditions
5. [The lesson that cost 214 XLM](./05-214-xlm-lesson.md) — Retrospective and lessons learned
