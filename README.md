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

## How ZK Powers the Gameplay

Stealth Battleship is a PvP naval warfare game where **Zero-Knowledge proofs replace trust entirely**. No board reveals, no trusted server, no way to cheat.

The ZK mechanic is not an add-on — it **is** the game:

1. **Board commitment** — Each player places ships and generates a `board_validity` proof (Noir + Poseidon2 hash). This proves the board follows the rules (correct ship sizes, no overlaps, within bounds) without revealing ship positions.
2. **Shot resolution** — On each shot, the defender generates a `shot_proof` proving whether the shot is a hit or miss against their committed board — without exposing it.
3. **Match finalization** — At game end, a `turns_proof` replays the entire match inside the circuit, computing the winner deterministically. No disputes possible.

> **Players never see each other's boards. The math guarantees fairness.**

---

## On-Chain Integration (Stellar Testnet)

The Soroban smart contract ([`soroban/contracts/battleship`](soroban/contracts/battleship/src/lib.rs)) verifies ZK proofs on-chain using the **UltraHonk** verifier and integrates with the **Game Hub contract**:

| Action | What happens on-chain |
|--------|----------------------|
| Match start | `open_match()` verifies both players' `board_validity` proofs, then calls **`start_game()`** on the Game Hub |
| Match end | `close_match()` verifies the `turns_proof`, then calls **`end_game()`** on the Game Hub with the verified winner |

**Game Hub contract:** `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`

This is possible thanks to **Protocol 25 (X-Ray)** which provides native BN254 elliptic-curve operations and Poseidon2 hashing at the protocol level.

---

## ZK Circuits (Noir)

Three specialized circuits in [`circuits/`](circuits/) guard the entire game lifecycle:

| Circuit | Trigger | What it proves | Public inputs |
|---------|---------|----------------|---------------|
| `board_validity` | Ship placement | Board is legal + Poseidon2 hash matches commitment | Board hash |
| `shot_proof` | Receive a shot | Hit/miss result is honest against committed board | Board hash, shot coords, result |
| `turns_proof` | Game ends | Full game replay inside circuit, winner computed deterministically | Both board hashes, all moves, winner |

- **Framework:** Noir 1.0.0-beta.18 (Aztec)
- **Proof system:** UltraHonk
- **Hash function:** Poseidon2 (Stellar-native)
- **Proof generation:** Client-side via NoirJS + bb.js (WASM)

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

## Architecture Flow

```
Player A (mobile)                    Backend                     Stellar Testnet
─────────────────                    ───────                     ───────────────
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
