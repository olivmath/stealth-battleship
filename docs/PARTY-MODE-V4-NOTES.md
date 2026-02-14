# Party Mode V4 - Discussion Notes (2026-02-14)

## Participants
- Cloud Dragonborn (Game Architect)
- Samus Shepard (Game Designer)
- Link Freeman (Game Dev)

## Key Decisions

### Blockchain: Stellar
- Protocol 25 (X-Ray) has native BN254 + Poseidon support
- UltraHonk Verifier Soroban contract exists (indextree/ultrahonk_soroban_contract)
- SDF partnered with Aztec for Noir verifier compatibility

### Smart Wallet: Passkey-based
- SDK: passkey-kit (kalepail/passkey-kit) — TypeScript
- Relay: Launchtube (handles fees, user doesn't need XLM)
- Flow: WebAuthn.create() → deploy smart wallet contract
- secp256r1 native verification since Protocol 21

### ZK Proofs: Noir (Aztec)
- 2 circuits needed (based on BattleZips-Noir):
  1. `board_validity` — proves ship placement is valid without revealing positions
  2. `shot_result` — proves hit/miss is honest against committed board
- Client-side: NoirJS generates proofs
- On-chain: UltraHonk Verifier on Soroban
- Hashing: migrate from SHA-256 to Poseidon (ZK-friendly, native on Stellar P25)
- Risk: NoirJS + WASM on React Native needs spike/PoC

### Economy Concepts (Future)
- ERC-8004 (Trustless Agents) — adapt concepts for Stellar, not cross-chain
- x402 — concept of programmatic payments via smart contract, not HTTP
- AI Agent Wallet — treasury that receives stakes from arcade losses
- Progressive stakes: free at low ranks, optional stakes at higher ranks

### Backend Change
- User chose **Convex** (edge functions) instead of Supabase
- Backend role: orchestrate PvP games + validate ZK proofs
- NOT handling wallet/web3 (that's on-chain via Soroban)

## Priority Order (Updated)
1. **ZK Circuits (Noir)** — board validity + shot verification
2. **PvP Backend (Convex)** — matchmaking, turn coordination, ZK validation
3. **Smart Wallet** — passkey login (later phase)
4. **Stakes/Economy** — escrow contracts (later phase)

## Research Files
- `.firecrawl/stellar-smart-wallets.md` — Stellar docs on smart wallets
- `.firecrawl/stellar-zk-proofs.md` — ZK on Stellar (BN254, Poseidon)
- `.firecrawl/noir-soroban-ultrahonk.md` — Noir UltraHonk Soroban discussion
- `.firecrawl/passkey-kit.md` — passkey-kit GitHub
- `.firecrawl/x402-protocol.md` — x402 protocol overview
- `.firecrawl/erc8004.md` — ERC-8004 spec

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  MOBILE APP (React Native / Expo)               │
│  ├── NoirJS → Proof Generation (client-side)    │
│  ├── Convex Client → matchmaking, turns         │
│  └── (Future) Passkey Kit → Smart Wallet        │
├─────────────────────────────────────────────────┤
│  CONVEX BACKEND                                 │
│  ├── Matchmaking + Realtime                     │
│  ├── Turn coordination                          │
│  └── ZK Proof Validation (server-side)          │
├─────────────────────────────────────────────────┤
│  SOROBAN SMART CONTRACTS (Future)               │
│  ├── Smart Wallet Contract (passkey auth)       │
│  ├── Match Contract (stakes + escrow)           │
│  ├── UltraHonk Verifier (on-chain ZK)          │
│  └── AI Agent Wallet                            │
└─────────────────────────────────────────────────┘
```
