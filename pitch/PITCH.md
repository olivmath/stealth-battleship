# Stealth Battleship — Stellar Hacks: ZK Gaming

> **Trustless naval warfare. Every shot proven. No board reveal needed.**

---

## One-Liner

Stealth Battleship — a trustless naval warfare game where every move is cryptographically proven using zero-knowledge proofs, built on Stellar.

---

## The Problem

In regular digital Battleship, someone always has to see both boards — a server, a smart contract, or an end-game reveal. That means you have to trust someone not to cheat.

We eliminate that entirely. With ZK proofs, **no one ever sees your board** — not the server, not the blockchain, anybody.

---

## How It Works: Three Noir Circuits — Client-Side

We have three Noir circuits running client-side:

| Circuit | What Happens |
|---|---|
| **Board Validity** | When you place your ships, a ZK proof generated on the device ensures your board is valid — correct ship sizes, no overlaps, within bounds — without revealing where. |
| **Shot Proof** | Whenever you receive a shot, the device responds with a proof that confirms whether it was a hit or a miss, verified against the hash of your committed board. Lying is mathematically impossible. |
| **Move Proof** (`turns_proof`) | At the end of the game, the entire game sequence is reproduced within a circuit to calculate and prove the winner by the backend and saved on chain. |

**Private inputs never leave the player's device.** The board, nonce, and ship positions stay local. Only cryptographic proofs and public commitments go on-chain.

---

## What Makes This Different

ZK isn't a feature — it **IS** the game. Remove it and nothing works.

- **Three specialized circuits** covering the complete game lifecycle.
- **Prove-as-you-go** — no commit-reveal, no board reveal, ever.
- **A real, polished mobile game** — with animations, haptics, AI opponent, match history, rankings, and three languages.

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

## Why Stellar

We chose Stellar because Protocol 25 X-Ray gives us **native BN254 curve operations and Poseidon2 hashing** — the exact primitives our Noir circuits use. This means proof verification on-chain is efficient, not emulated.

| Stellar Feature | How We Use It |
|---|---|
| **Protocol 25 (X-Ray)** | Native BN254 curve ops + Poseidon2 hash — the exact primitives our Noir circuits use |
| **Poseidon2 on-chain** | Board hashes are computed with Poseidon, verified natively on Soroban — no expensive emulation |
| **Low tx cost** | 3 blockchain moments per game makes on-chain anchoring viable for every match |
| **XLM payments** | Entry fee paid in XLM at match start |
| **BATTLE custom asset** | Custom token with clawback issued at match start, clawed back to winner at end |
| **Soroban smart contracts** | UltraHonk verifier deployed for board_validity proof verification |

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
Private: board, nonce
Public:  board_hash, ship_sizes

Proves: valid ship placement (sizes, bounds, no overlaps)
        + board_hash == Poseidon(board, nonce)
```

### `shot_proof`
```
Private: board, nonce
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
| 3+1 Noir circuits (board_validity, shot_proof, turns_proof, hash_helper) | Done |
| Full mobile game (6x6/10x10 grid, AI opponent, animations, haptics) | Done |
| ZK Service (WebView proof generation — NoirJS + bb.js) | Done |
| Express + Socket.io backend (PvP real-time) | Done |
| Supabase integration (persistence, rankings, stats) | Done |
| Stellar payment flow (XLM + BATTLE token with clawback) | Done |
| Web client for PvP | Done |
| Ed25519 signed actions (anti-cheat) | Done |
| i18n (EN, PT-BR, ES) | Done |
| Match history, ranking system (6 ranks), settings | Done |

---

## Game Flow — Player Experience

### Demo Flow
```
1. Place ships on 10x10 grid — drag & drop, or auto placed
2. Tap Ready → "Securing your fleet..." (board_validity proof on device, ~2-5s)
3. Board hash committed on Stellar via Soroban
4. Battle — tap to attack, opponent's device generates shot_proof
5. Game ends — server generates turns_proof, submits on-chain
6. BATTLE token clawed back to winner
```

The ZK proof generation is masked by loading animations — the player sees "Securing your fleet..." while Noir circuits crunch in the background. The game feels smooth; the math is invisible.

---

## What Makes This Different

1. **ZK isn't a feature — it IS the game.** Remove it and nothing works.

2. **Three specialized circuits** covering the complete game lifecycle.

3. **Prove-as-you-go** — no commit-reveal, no board reveal, ever.

4. **A real, polished mobile game** — with animations, haptics, AI opponent, match history, rankings, and three languages.

---

## Team

**olivmath** — Solo developer. Full-stack engineer with deep experience in cryptography, blockchain, and mobile development. Building at the intersection of ZK and gaming.

---

## Links

- **GitHub:** [battleship-zk](https://github.com/olivmath/stealth-battleship)
- **Demo Video:** _(to be recorded)_
- **Stellar Testnet Contract:** _(to be deployed)_

---

## Summary

Stealth Battleship proves that zero-knowledge isn't just for DeFi — it's the foundation of fair, trustless gaming. On Stellar's Protocol 25, we have everything we need to make this real.

**Fair by math. Fun by design.**


https://www.youtube.com/watch?v=1n8LKx59p6E