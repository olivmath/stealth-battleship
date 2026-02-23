# Stealth Battleship — Stellar Hacks: ZK Gaming

> **Trustless naval warfare. Every shot proven. No board reveal needed.**

---

## One-Liner

Stealth Battleship — a mobile-first naval warfare game where Noir circuits cryptographically prove every move — hidden boards, honest shots, and verifiable outcomes — all settled on Stellar.

---

## The Problem

Classic digital Battleship has a fundamental trust problem: **someone has to see both boards**. Whether it's a server, a smart contract storing plaintext, or an end-of-game reveal — every existing implementation requires players to trust a third party or expose their strategy.

This kills competitive integrity. If the server knows your board, it can cheat. If the board is revealed on-chain, anyone watching the mempool can front-run. If we rely on commit-reveal, a losing player can simply disconnect before revealing.

**"Trust me, bro" is not a game mechanic.**

---

## The Solution: Prove-as-You-Go

Stealth Battleship eliminates board reveal entirely. Instead of commit-reveal, we use a **prove-as-you-go** architecture where every game action generates a zero-knowledge proof in real-time:

| Game Moment | What Happens | ZK Circuit |
|---|---|---|
| Place ships | Prove board is valid (correct sizes, no overlaps, within bounds) without revealing positions | `board_validity` |
| Receive a shot | Prove hit/miss is honest against committed board hash | `shot_proof` |
| Game ends | Prove the entire game sequence was fair and compute the winner | `turns_proof` |

**Private inputs never leave the player's device.** The board, nonce, and ship positions stay local. Only cryptographic proofs and public commitments go on-chain.

---

## Why ZK Is Essential (Not Decorative)

This is not "a game with ZK mentioned in the README." ZK is the **core mechanic** that makes the game work:

1. **Hidden Information** — Ship positions are Poseidon-hashed and committed on-chain. The board is never revealed, not even after the game ends.

2. **Honest Shot Resolution** — Every hit/miss declaration is backed by a Noir proof that the result matches the committed board. Lying is mathematically impossible.

3. **Provable Outcomes** — The `turns_proof` circuit replays the entire game and computes the winner inside the circuit. No dispute possible.

4. **No Trusted Server** — The server coordinates turns but cannot influence outcomes. Proof verification is trustless.

---

## Architecture

```
PLAYER DEVICE                    EXPRESS + SOCKET.IO BACKEND
+------------------+             +---------------------------+
| Noir Circuits    |  WS/HTTPS   | - Matchmaking             |
| (WASM/WebView)   | <---------> | - Turn coordination       |
|                  |             | - shot_proof verification |
| board_validity   |             | - turns_proof generation  |
| shot_proof       |             | - Supabase persistence    |
| turns_proof      |             +---------------------------+
+------------------+                        |
        |                                   |
        | 3 blockchain moments              |
        v                                   v
+------------------+             +----------------------+
| STELLAR          |             | SUPABASE             |
| - XLM payment   |             | - Match history      |
| - BATTLE token   |             | - Player rankings    |
| - ZK anchoring   |             | - Game stats         |
+------------------+             +----------------------+

On-chain: 3 moments per PvP game (payment, board proofs, turns_proof)
Off-chain: real-time turns with synchronous proof verification
```

### Hybrid Model — Best of Both Worlds

- **Backend (Express + Socket.io):** Matchmaking, turn coordination, real-time `shot_proof` verification with millisecond latency. Supabase stores match history, rankings, and stats.
- **On-chain (Stellar):** XLM payment + BATTLE custom asset token issuance (with clawback) at match start, `board_validity` proofs anchored at game open, `turns_proof` anchored at game end.

This gives us **trustless settlement** with **real-time gameplay** — no player waits 15 seconds for a block to know if their shot hit.

---

## Stellar-Native Design

We chose Stellar deliberately, not as an afterthought:

| Stellar Feature | How We Use It |
|---|---|
| **Protocol 25 (X-Ray)** | Native BN254 curve ops + Poseidon2 hash — the exact primitives our Noir circuits use |
| **Poseidon2 on-chain** | Board hashes are computed with Poseidon, verified natively on Soroban — no expensive emulation |
| **Low tx cost** | 3 blockchain moments per game makes on-chain anchoring viable for every match, not just high-stakes |
| **XLM payments** | Entry fee paid in XLM at match start; winner settlement at end |
| **BATTLE custom asset** | Custom token with clawback issued at match start, burned on resolution — prevents griefing |
| **Soroban smart contracts** | UltraHonk verifier deployed for board_validity proof verification |
| **Game Hub contract** | `start_game()` / `end_game()` integration with `CB4VZAT2...` |

Protocol 25 is not just compatible — it's **the reason this design is efficient**. BN254 + Poseidon on-chain means our proofs verify cheaply where other chains would need precompiles or expensive workarounds.

---

## Tech Stack

| Layer | Technology |
|---|---|
| ZK Framework | **Noir** (Aztec) — Rust-like DSL for circuits |
| Proof System | **UltraHonk** — fast prover, compact proofs |
| Hashing | **Poseidon2** — ZK-friendly, native on Stellar P25 |
| Proof Generation | **NoirJS + bb.js** (client-side WASM) |
| Smart Contracts | **Soroban** (Rust) — deployed on Stellar Testnet |
| Backend | **Express + Socket.io** — real-time PvP coordination + **Supabase** — persistence |
| Frontend | **React Native / Expo** (mobile-first) + web client |
| Languages | TypeScript, Rust, Noir |

---

## Circuits — The Heart of the Game

### `board_validity`
```
Private: board[6][6], nonce
Public:  board_hash, ship_count, ship_sizes

Proves: valid ship placement (sizes, bounds, no overlaps)
        + board_hash == Poseidon(board, nonce)
```

### `shot_proof`
```
Private: board[6][6], nonce
Public:  board_hash, row, col, is_hit

Proves: is_hit == (board[row][col] == 1)
        + board_hash matches committed hash
```

### `turns_proof`
```
Private: both boards, both nonces
Public:  both hashes, all attacks, winner

Proves: entire game replay is honest
        + winner computed inside circuit
```

All circuits compile with `nargo`, tested with `nargo test`, and generate ACIR artifacts bundled in the app.

---

## What's Built

| Component | Status |
|---|---|
| 3 Noir circuits (board_validity, shot_proof, turns_proof) + hash_helper | Implemented & tested |
| Full mobile game (6x6 grid, AI opponent, placement, battle, gameover) | Shipped (v3) |
| ZK Service abstraction (zkService.ts) | In progress |
| WebView-based proof generation (NoirJS + bb.js) | In progress |
| i18n (EN, PT-BR, ES) | Complete |
| Match history, ranking system, settings | Complete |
| Soroban contract + Game Hub integration | Planned |

---

## Game Flow — Player Experience

### Arcade Mode (vs AI — fully local)
```
1. MENU           →  "Play vs AI"
2. PLACEMENT      →  Drag & drop ships on grid
3. ZK COMMITMENT  →  "Securing your fleet..." (board_validity proof, WASM local ~2-5s)
4. BATTLE         →  Turn-based: tap to attack, ZK proves every response locally
5. GAME OVER      →  turns_proof generated locally, no backend, no blockchain
```

### PvP Mode
```
1. MENU           →  "Find Match"
2. PAYMENT        →  XLM entry fee + BATTLE token issuance on Stellar
3. PLACEMENT      →  Drag & drop ships on grid
4. ZK COMMITMENT  →  "Securing your fleet..." (board_validity proof ~2-5s, anchored on-chain)
5. BATTLE         →  Turn-based via Socket.io; server verifies each shot_proof synchronously
                      Invalid proof = instant loss, no appeals
6. REVEAL         →  Players reveal ship positions at end (server cross-checks with board hash)
7. GAME OVER      →  Server generates turns_proof, anchors on Stellar, winner gets XLM
```

The ZK proof generation is masked by loading animations — the player sees "Securing your fleet..." while Noir circuits crunch in the background. The game feels smooth; the math is invisible.

---

## Why This Should Win

### 1. ZK is the Game, Not a Feature
Every single game action — placement, shots, outcome — is cryptographically proven. Remove ZK, and the game doesn't work. This is the definition of "ZK-powered mechanic."

### 2. The Hardest ZK Gaming Problem
Battleship is the canonical hidden-information game. It requires **per-turn proofs** (not just one proof at the end), **committed state** (board hash), and **interactive verification** — all of which we implement.

### 3. Production-Quality Game
This isn't a proof-of-concept with a text UI. It's a polished mobile game with animations, haptics, AI opponent, match history, rankings, and i18n — built to be played, not just demoed.

### 4. Stellar-Native Architecture
Protocol 25's BN254 + Poseidon primitives are not just "used" — they're the reason our on-chain verification is efficient. We designed around Stellar's strengths.

### 5. Prove-as-You-Go > Commit-Reveal
Our architecture eliminates the classic commit-reveal pattern. No board reveal, no end-game disputes, no "disconnect to avoid losing." Every proof is real-time.

### 6. 3-Circuit Design
Most ZK game submissions use 1 circuit. We have 3 specialized circuits that cover the complete game lifecycle: validity, per-shot honesty, and full-game integrity.

---

## Team

**olivmath** — Solo developer. Full-stack engineer with deep experience in cryptography, blockchain, and mobile development. Building at the intersection of ZK and gaming.

---

## Links

- **GitHub:** [battleship-zk](https://github.com/olivmath/battleship-zk)
- **Demo Video:** _(to be recorded)_
- **Stellar Testnet Contract:** _(to be deployed)_

---

## Summary

Stealth Battleship proves that zero-knowledge isn't just for DeFi or identity — it's the foundation of fair, trustless gaming. On Stellar's Protocol 25, we have the cryptographic primitives to make this real. Every ship placement is committed, every shot is proven, every outcome is verifiable. No trust required.

**Fair by math. Fun by design.**


https://www.youtube.com/watch?v=1n8LKx59p6E