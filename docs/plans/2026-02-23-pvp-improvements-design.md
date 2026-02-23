# PvP Improvements Sprint — Design Document

**Date:** 2026-02-23
**Status:** Approved

## Overview

10 improvements across bugs, observability, persistence, payments, and responsiveness.

---

## 1. Bug Fix — Sunk Ship Notification for Both Players

**Problem:** Only the defender sees `SunkShipModal` when their ship is sunk. The attacker gets `battle:result_confirmed` with `result: 'sunk'` but no ship info.

**Solution:**
- Defender sends `sunkShipName` and `sunkShipSize` in `battle:shot_result` when `result === 'sunk'`
- Backend passes these fields through in `battle:result_confirmed` to attacker
- Attacker creates synthetic `PlacedShip` from name+size to render `SunkShipModal`
- Both players see the sinking animation with ship name

**Files:** `backend/src/battle/translator.ts`, `web/src/pages/Battle.tsx`, `web/src/pvp/entities.ts`

---

## 2. Bug Fix — PvP Random Matchmaking Not Working

**Probable cause:** `gridSize` mismatch between players (undefined vs 10), or queue not being properly populated.

**Action:** Debug `findRandomMatch` in `backend/src/matchmaking/interactor.ts`, verify socket events in `web/src/pvp/interactor.ts`.

**Files:** `backend/src/matchmaking/interactor.ts`, `backend/src/matchmaking/translator.ts`, `web/src/pvp/interactor.ts`, `web/src/pages/PvpLobby.tsx`

---

## 3. Logs — Web Proof Generation (UI)

**Current state:** `console.log` with timing exists in `Battle.tsx`.

**Solution:** `ZKProofLog` floating panel component:
- Bottom-right corner, toggleable
- Shows: circuit name, time (s), proof size (bytes), status (ok/fail)
- Each entry timestamped
- Semi-transparent dark overlay, monospace font

**Files:** New `web/src/components/UI/ZKProofLog.tsx`, `web/src/pages/Battle.tsx`

---

## 4. Logs — Backend Proof Validation

**Solution:** Structured logging in all verify endpoints:
- Format: `[VERIFY] player=${pk8} circuit=${name} size=${bytes}B time=${ms}ms valid=${bool}`
- Store in `proof_logs` table (Supabase)
- Add timing wrapper around `backend.verifyProof()`

**Files:** `backend/src/board-validity/verify-interactor.ts`, `backend/src/shot-proof/verify-interactor.ts`, `backend/src/turns-proof/verify-interactor.ts`

---

## 5. Database — Supabase

**Setup:** Supabase CLI (`npx supabase init`, migrations)

**Schema:**

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'waiting',
  grid_size INTEGER NOT NULL DEFAULT 10,
  player1_pk TEXT NOT NULL,
  player2_pk TEXT,
  winner_pk TEXT,
  reason TEXT,
  turn_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE attacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  attacker_pk TEXT NOT NULL,
  row INTEGER NOT NULL,
  col INTEGER NOT NULL,
  result TEXT, -- 'hit', 'miss', 'sunk'
  turn_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE proof_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  player_pk TEXT NOT NULL,
  circuit TEXT NOT NULL,
  proof_size_bytes INTEGER,
  generation_time_ms REAL,
  verification_time_ms REAL,
  valid BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_pk TEXT NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  amount_xlm NUMERIC(18,7) NOT NULL,
  match_id UUID REFERENCES matches(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE player_stats (
  player_pk TEXT PRIMARY KEY,
  display_name TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  total_shots INTEGER DEFAULT 0,
  total_hits INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'Recruit',
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Backend integration:** Use `@supabase/supabase-js` client, persist match lifecycle events.

---

## 6. Migration Doc — Backend → Supabase Deploy

Separate document: `docs/plans/2026-02-23-supabase-migration-guide.md`

Contents:
- Express → Supabase Edge Functions mapping
- Socket.io → Supabase Realtime channels
- Auth migration (Ed25519 custom → Supabase Auth)
- RLS policies per table
- Environment variables mapping
- Step-by-step checklist

---

## 7. Payment — 0.001 XLM per PvP Match

**Flow:**
1. Backend loads Stellar keypair from `STELLAR_SERVER_SEED` env var
2. Exposes server public key via `GET /api/payment/address`
3. Frontend displays payment address + amount before matchmaking
4. Player sends 0.001 XLM transaction with memo = their publicKey
5. Frontend sends `txHash` with `match:find_random` / `match:create_friend`
6. Backend verifies via Horizon API: `GET https://horizon.stellar.org/transactions/{hash}`
7. Validates: destination, amount >= 0.001 XLM, memo
8. If valid → allow matchmaking, save to `payments` table
9. If invalid → reject with `match:error`

**Dependencies:** `@stellar/stellar-sdk` on both backend and frontend

**Files:** New `backend/src/payment/`, `web/src/pages/PvpMode.tsx`, `web/src/wallet/interactor.ts`

---

## 8. Responsiveness — All Pages

**Approach:** Use existing `useResponsive()` hook + `LAYOUT` tokens.

**Pages to review:**
- Splash, Login: center content, scale logo
- Menu: card grid on desktop, stack on mobile
- Placement: board + ship selector layout
- Battle: already has responsive layout ✓
- GameOver: stats cards side-by-side on desktop
- Settings, Profile, Wallet, WalletSetup: max-width container
- PvpMode, PvpFriend, PvpLobby: centered content
- Tutorial, MatchHistory, MatchDetail: scrollable content

**Pattern:** Wrap each page in `PageShell` component (already exists) with responsive max-width.
