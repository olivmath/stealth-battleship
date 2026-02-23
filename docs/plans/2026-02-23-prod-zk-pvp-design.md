# Production ZK PvP + Arcade Design

**Date:** 2026-02-23
**Status:** Approved

## Overview

Remove all mocks, local/server ZK mode toggle, and in-memory payment tracking. Wire real ZK proof verification, blockchain token payments, and Supabase persistence. Two modes: Arcade (fully local) and PvP (server-validated + blockchain).

## 1. Payment + BATTLE Token

### Flow
1. Client requests random memo: `GET /api/payment/memo` → server generates memo (e.g. `BZK-a7f3b2`), saves to Supabase `pending_payments` table with 10min TTL
2. Client builds **1 atomic transaction with 2 operations**:
   - `changeTrust(BATTLE, server_issuer)` — creates trustline (idempotent if exists)
   - `payment(0.001 XLM, server_address, memo)` — pays the fee
3. Client signs and submits
4. Server detects payment via **Horizon SSE stream** (filters payments to its address)
5. On valid memo match: server emits **1 BATTLE token** (Stellar Custom Asset) to player wallet
6. Matchmaking: server checks BATTLE token balance on-chain before allowing queue entry
7. On match: server does **clawback** of 1 BATTLE token from each player

### Stellar Custom Asset Setup (one-time)
- Server keypair is issuer of asset `BATTLE`
- Asset flags: `AUTH_REQUIRED`, `AUTH_REVOCABLE`, `AUTH_CLAWBACK_ENABLED`
- Server authorizes trustlines and emits tokens

### New Supabase Table
```sql
CREATE TABLE pending_payments (
  memo TEXT PRIMARY KEY,
  player_pk TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending', -- pending, matched, expired
  expires_at TIMESTAMPTZ NOT NULL
);
```

Existing `payments` table gains `battle_token_tx_hash` column.

## 2. Arcade ZK Flow (Fully Local)

1. **Placement:** Client generates `board_validity` proof (WASM) for player AND AI. Saves `{ boardHash, nonce, proof }` in GameState
2. **Turns:** Each attack generates `shot_proof` (WASM) in background. Saved in local match history
3. **Final:** Client generates `turns_proof` (WASM) with complete data. Saved in match history

**No backend calls.** All ZK operations happen client-side via WebWasmZKProvider.

## 3. PvP ZK Flow

### Start (Placement)
1. Each player generates `board_validity` proof locally (WASM)
2. Sends `{ boardHash, proof }` via socket `placement:ready`
3. Server **verifies proof synchronously** (Noir verify, ~1-3s)
4. If invalid → player loses by `invalid_proof`, match ends
5. When both proofs verified: server sends proofs to **blockchain** and saves to Supabase
6. Emits `placement:both_ready` to both players

### Turns (Battle)
1. Attacker sends `battle:attack { row, col }`
2. Server forwards to defender `battle:incoming_attack`
3. Defender processes locally, generates `shot_proof` (WASM), sends `battle:shot_result { row, col, result, proof }`
4. Server **verifies shot_proof synchronously** — public inputs: `[boardHash, row, col, isHit]`
5. If invalid → defender loses by `invalid_proof`
6. If valid → confirms result, saves attack + proof to Supabase, emits `battle:result_confirmed`
7. Next turn

### Final
1. Server detects win condition (all_ships_sunk, timeout, forfeit, invalid_proof)
2. Emits `battle:game_over` to both players
3. Both clients send `battle:reveal { ships, nonce }`
4. Server validates `poseidon2(ships, nonce) == boardHash` from placement
5. If hash mismatch → player loses by `invalid_reveal`
6. With both valid reveals: server generates `turns_proof` with complete data
7. Server sends proof to **blockchain** and saves to Supabase
8. Emits `battle:finalized { turnsProofHash, txHash }` to both

### What Server Saves to Supabase Per PvP Match
- `matches`: match metadata
- `attacks`: each turn with proof
- `proof_logs`: board_validity (x2) + shot_proofs (all) + turns_proof (1)
- `payments`: XLM payment + BATTLE token issued + clawback

### What Goes to Blockchain
- Start: board_validity proof hashes
- End: turns_proof

## 4. Cleanup + Removals

### Remove from web/
- `VITE_ZK_MODE` env var and all local/server selection logic
- `web/src/zk/adapter.ts` (ServerZKProvider) — delete entire file
- ServerZKProvider references in `App.tsx`
- `web/src/game/adapter.ts` (InMemoryGameRepository) — delete file

### Remove from backend/
- `backend/src/payment/entities.ts` — `verifiedPayments` Map
- All `hasValidPayment` / `consumePayment` Map-based logic — replace with on-chain BATTLE token check
- REST prove endpoints (`POST /api/prove/*`) — proof generation is now client-only
- `backend/src/board-validity/adapter.ts`, `interactor.ts`, `translator.ts` (generate side)
- `backend/src/shot-proof/adapter.ts`, `interactor.ts`, `translator.ts` (generate side)
- `backend/src/turns-proof/translator.ts` (REST endpoint)
- TODOs in `battle/translator.ts` — replace with real verify calls

### Keep in backend/
- `verify-adapter.ts`, `verify-interactor.ts`, `verify-translator.ts` for each circuit
- `turns-proof/adapter.ts` and `interactor.ts` — server generates turns_proof at PvP end
- `shared/circuits.ts` — loads circuits for verify + turns_proof generate
- `shared/persistence.ts` + `supabase.ts` — used for real persistence
- Matchmaking in-memory — acceptable for single-instance Railway

### Deletion Summary

| Directory | Delete | Keep |
|---|---|---|
| `backend/board-validity/` | adapter, interactor, translator | verify-* (3 files) |
| `backend/shot-proof/` | adapter, interactor, translator | verify-* (3 files) |
| `backend/turns-proof/` | translator (REST) | adapter, interactor, verify-* |
| `backend/payment/` | verifiedPayments Map, in-memory logic | rewrite with Stellar Asset + SSE |
| `web/src/zk/` | adapter.ts (ServerZKProvider) | webWasmProvider.ts, interactor.ts, entities, circuits |
| `web/src/game/` | adapter.ts (InMemoryGameRepository) | engine, translator |

## 5. Infrastructure

- **Backend deploy:** Railway (Node.js)
- **Database:** Supabase (existing schema + new pending_payments table)
- **Blockchain:** Stellar Testnet (payments, BATTLE token, proof submissions)

## 6. Pitch Updates

Update all pitch materials to reflect real architecture:
- "Convex off-chain" → "Express + Socket.io + Supabase"
- "2 txs per game" → "3 blockchain moments: payment/token, board proofs, turns_proof"
- "escrow released" → "BATTLE token clawback"
- "local/server ZK mode" → "always client-side WASM"
- Update: PITCH.md, video scripts (ROTEIRO-*.md, GUIA-CENAS.md), slides (ROTEIRO-SLIDES.md, src/index.tsx)
- Keep: narrative tone, naval aesthetic, tagline, scene structure
