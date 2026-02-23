<p align="center">
  <img src="assets/banner.jpg" alt="Stealth Battleship" width="100%" />
</p>

<h1 align="center">STEALTH BATTLESHIP</h1>

<p align="center"><strong>Trustless Naval Warfare on Stellar</strong></p>

<p align="center">
  <em>Fair by math. Fun by design.</em>
</p>

<p align="center">
  Built for <strong>Stellar Hacks: ZK Gaming 2026</strong>
</p>

---

## Demo Video

https://github.com/olivmath/stealth-battleship/raw/main/assets/zkbb.mp4

---

## The Problem

In digital Battleship, someone always sees both boards. The server knows everything.

<p align="center">
  <img src="pitch/slides/slide-2-problem.png" width="700" />
</p>

Traditional approaches all fail: the server can cheat, commit-reveal breaks when the loser disconnects, and on-chain boards leak to mempool front-running.

---

## The Solution: Prove-as-You-Go

No board reveal. No commit-reveal. Every action generates a ZK proof in real-time. **Private inputs never leave your device.**

<p align="center">
  <img src="pitch/slides/slide-3-solution.png" width="700" />
</p>

---

## ZK Circuits (Noir)

Three specialized circuits guard the entire game lifecycle:

<p align="center">
  <img src="pitch/slides/slide-4-circuit.png" width="700" />
</p>

| Circuit | Trigger | What it proves | Public inputs |
|---------|---------|----------------|---------------|
| `board_validity` | Ship placement | Board is legal + Poseidon2 hash matches commitment | Board hash |
| `shot_proof` | Receive a shot | Hit/miss result is honest against committed board | Board hash, shot coords, result |
| `turns_proof` | Game ends | Full game replay inside circuit, winner computed deterministically | Both board hashes, all moves, winner |

- **Framework:** Noir 1.0.0-beta.18 (Aztec)
- **Proof system:** UltraHonk
- **Hash function:** Poseidon2 (Stellar-native)
- **Proof generation:** Client-side via NoirJS + bb.js (WASM)

> **Players never see each other's boards. The math guarantees fairness.**

---

## Architecture

Hybrid on-chain / off-chain — only 2 Soroban transactions per game.

<p align="center">
  <img src="pitch/slides/slide-7-arch.png" width="700" />
</p>

```
Player Device (client)               Backend                     Stellar Testnet
──────────────────────               ───────                     ───────────────
Place ships
Generate board_validity proof ──→ Receive proof ──────────→ open_match()
                                                            ├─ verify proof (UltraHonk)
                                                            └─ start_game() on Game Hub
                                     ↕ Socket.io
Play turns (shot_proof each) ←──→ Relay & verify

Game ends
Generate turns_proof ───────────→ Receive proof ──────────→ close_match()
                                                            ├─ verify proof (UltraHonk)
                                                            └─ end_game() on Game Hub
```

---

## Deployed on Stellar Testnet

All contracts and wallets are live and verifiable on Stellar Testnet:

| Resource | Address | Explorer |
|----------|---------|----------|
| **Battleship Verifier Contract** | `CDL6EX734XCDSTOQE5W3FYD5ZKOHQOIBXZOL4NF5FC66CEHRPIQRHMR3` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDL6EX734XCDSTOQE5W3FYD5ZKOHQOIBXZOL4NF5FC66CEHRPIQRHMR3) |
| **Game Hub Contract** | `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG) |
| **Backend Wallet** (124 operations) | `GDANLGAOCSGXHMSO4PM2L43FB27MB7JBDXKSBV5CMCCEFXE3ISDEM4Z2` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/account/GDANLGAOCSGXHMSO4PM2L43FB27MB7JBDXKSBV5CMCCEFXE3ISDEM4Z2) |

**Key transactions:**
- [Contract WASM Upload](https://stellar.expert/explorer/testnet/tx/5048454883590145) — UltraHonk verifier bytecode
- [Contract Deploy (`__constructor`)](https://stellar.expert/explorer/testnet/tx/294164c1a5fe5d0dd7ef7684a440743d2afa433e8c48d1007859e90706b2b481) — initialized with admin, Game Hub address, and both verification keys

The Soroban contract ([`soroban/contracts/battleship`](soroban/contracts/battleship/src/lib.rs)) verifies ZK proofs on-chain and integrates with the Game Hub:

| Action | What happens on-chain |
|--------|----------------------|
| Match start | `open_match()` verifies both players' `board_validity` proofs, then calls **`start_game()`** on the Game Hub |
| Match end | `close_match()` verifies the `turns_proof`, then calls **`end_game()`** on the Game Hub with the verified winner |

This is possible thanks to **Protocol 25 (X-Ray)** which provides native BN254 elliptic-curve operations and Poseidon2 hashing at the protocol level.

---

## What's Built

<p align="center">
  <img src="pitch/slides/slide-11-status.png" width="700" />
</p>

---

## Screenshots

<table>
  <tr>
    <td align="center"><img src="screenshots/01-splash.png" width="200" /><br/><sub>Splash</sub></td>
    <td align="center"><img src="screenshots/02-login.png" width="200" /><br/><sub>Login</sub></td>
    <td align="center"><img src="screenshots/03-menu.png" width="200" /><br/><sub>Menu</sub></td>
    <td align="center"><img src="screenshots/04-tutorial.png" width="200" /><br/><sub>Tutorial</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/05-placement.png" width="200" /><br/><sub>Ship Placement</sub></td>
    <td align="center"><img src="screenshots/06-settings.png" width="200" /><br/><sub>Settings</sub></td>
    <td align="center"><img src="screenshots/07-profile.png" width="200" /><br/><sub>Profile</sub></td>
    <td align="center"><img src="screenshots/08-match-history.png" width="200" /><br/><sub>Match History</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/09-match-detail.png" width="200" /><br/><sub>Match Detail</sub></td>
    <td align="center"><img src="screenshots/10-wallet.png" width="200" /><br/><sub>Wallet</sub></td>
    <td align="center"><img src="screenshots/11-wallet-setup.png" width="200" /><br/><sub>Wallet Setup</sub></td>
    <td align="center"><img src="screenshots/12-pvp-mode.png" width="200" /><br/><sub>PvP Mode</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/13-pvp-friend.png" width="200" /><br/><sub>PvP Friend</sub></td>
    <td align="center"><img src="screenshots/14-pvp-lobby.png" width="200" /><br/><sub>PvP Lobby</sub></td>
  </tr>
</table>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ZK Framework | Noir (Aztec) + UltraHonk |
| Hashing | Poseidon2 (Stellar-native via Protocol 25) |
| Proof Generation | NoirJS + bb.js (client-side WASM) |
| Blockchain | Stellar / Soroban (Protocol 25 X-Ray) |
| On-chain Verifier | `ultrahonk_soroban_verifier` crate |
| Backend | Express + Socket.io (real-time PvP) |
| Persistence | Supabase |
| Mobile App | React Native / Expo |
| Languages | TypeScript, Rust, Noir |

---

## Project Structure

```
stealth-battleship/
├── circuits/        # Noir ZK circuits (board_validity, shot_proof, turns_proof)
├── soroban/         # Soroban smart contract (on-chain ZK verification + Game Hub)
├── backend/         # Express + Socket.io server (matchmaking, proof relay)
├── mobile/          # React Native / Expo app
├── web/             # Web client for PvP
├── pitch/           # Presentation slides + video trailer
└── docs/            # Architecture & design docs
```

---

## How to Run

```bash
# 1. Compile ZK circuits
cd circuits && ./compile.sh

# 2. Deploy Soroban contract
cd soroban && ./deploy.sh

# 3. Start backend
cd backend && npm install && npm run dev

# 4. Start mobile app
cd mobile && npx expo start
```

---

## License

MIT

---

<p align="center">
  <a href="https://github.com/olivmath/stealth-battleship">github.com/olivmath/stealth-battleship</a>
</p>
