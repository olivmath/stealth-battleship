# PvP Improvements Sprint — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix PvP bugs (matchmaking + sunk ship display), add observability (ZK proof logs), integrate Supabase database, add XLM payment gate, improve responsiveness, and document Supabase migration.

**Architecture:** Backend uses Express + Socket.io with IATE pattern. Frontend is React + Vite with domain-based IATE. ZK proofs via NoirJS/bb.js. Stellar wallet via tweetnacl. Supabase for persistence via `@supabase/supabase-js`.

**Tech Stack:** TypeScript, Express, Socket.io, Supabase (PostgreSQL), @stellar/stellar-sdk, React, Vite, CSS Modules + inline styles

---

## Task 1: Fix PvP Random Matchmaking

**Files:**
- Modify: `web/src/pages/PvpLobby.tsx:15,26,79`

**Step 1: Fix gridSize source**

In `PvpLobby.tsx`, the component destructures only `dispatch` from `useGame()` but never reads `state`. Line 26 hardcodes `pvp.findRandomMatch(10)`.

```tsx
// Line 15 — change:
const { dispatch } = useGame();
// to:
const { state, dispatch } = useGame();
```

```tsx
// Line 26 — change:
pvp.findRandomMatch(10);
// to:
pvp.findRandomMatch(state.settings.gridSize);
```

```tsx
// Line 79 — change:
onPress={() => pvp.findRandomMatch(10)}
// to:
onPress={() => pvp.findRandomMatch(state.settings.gridSize)}
```

**Step 2: Verify fix**

Run: `cd web && npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add web/src/pages/PvpLobby.tsx
git commit -m "fix(pvp): use dynamic gridSize from settings in random matchmaking"
```

---

## Task 2: Show Sunk Ship Info to Both Players

**Files:**
- Modify: `backend/src/battle/entities.ts` (add sunk fields to ShotResultPayload)
- Modify: `backend/src/battle/translator.ts:175-186` (forward sunk info)
- Modify: `web/src/pvp/entities.ts:33-38` (add sunk fields to PvPResultConfirmed)
- Modify: `web/src/pages/Battle.tsx:143-158` (show sunk modal for attacker)

**Step 1: Add sunk fields to backend ShotResultPayload**

In `backend/src/battle/entities.ts`, add optional sunk fields:

```typescript
export interface ShotResultPayload {
  matchId: string;
  row: number;
  col: number;
  result: 'hit' | 'miss';
  sunkShipName?: string;   // NEW: name of sunk ship (e.g., 'destroyer')
  sunkShipSize?: number;   // NEW: size of sunk ship
  proof: number[];
  timestamp: number;
  signature: string;
}
```

**Step 2: Forward sunk info in backend translator**

In `backend/src/battle/translator.ts`, modify the `battle:shot_result` handler (around line 180). Pass through sunk info:

```typescript
// After line 179, modify the emit to include sunk info:
io.to(attackerSocketId).emit('battle:result_confirmed', {
  row: data.row,
  col: data.col,
  result: data.result,
  turnNumber: match.turnNumber,
  sunkShipName: data.sunkShipName,   // NEW
  sunkShipSize: data.sunkShipSize,   // NEW
});
```

**Step 3: Update frontend PvPResultConfirmed type**

In `web/src/pvp/entities.ts`:

```typescript
export interface PvPResultConfirmed {
  row: number;
  col: number;
  result: 'hit' | 'miss';
  turnNumber: number;
  sunkShipName?: string;   // NEW
  sunkShipSize?: number;   // NEW
}
```

**Step 4: Send sunk ship info from defender (Battle.tsx)**

In `web/src/pages/Battle.tsx`, in the incoming attack handler (lines 172-199), when a ship is sunk, include the ship info in the response:

```typescript
// Around line 186, change the respondShotResult calls to include sunk info
const sunkInfo = result === 'sunk'
  ? { sunkShipName: newShips.find(s => s.id === shipId)?.name, sunkShipSize: newShips.find(s => s.id === shipId)?.size }
  : {};

// Replace all pvp.respondShotResult calls in this block with:
pvp.respondShotResult(atk.row, atk.col, proofResult as 'hit' | 'miss', [], sunkInfo.sunkShipName, sunkInfo.sunkShipSize);
```

**Step 5: Update respondShotResult signature in pvp interactor**

In `web/src/pvp/interactor.ts`, update `respondShotResult` to accept and send optional sunk fields:

```typescript
respondShotResult(row: number, col: number, result: 'hit' | 'miss', proof: number[], sunkShipName?: string, sunkShipSize?: number) {
  // ... existing code ...
  socket.emit('battle:shot_result', {
    matchId, row, col, result, proof, timestamp, signature,
    sunkShipName, sunkShipSize,  // NEW
  });
}
```

**Step 6: Show sunk modal for attacker (Battle.tsx)**

In `web/src/pages/Battle.tsx`, in the result_confirmed handler (lines 143-158), add sunk animation:

```typescript
// After line 157 (after haptics.medium()), add:
if (rc.sunkShipName && rc.sunkShipSize) {
  const syntheticShip: PlacedShip = {
    id: `sunk-${rc.turnNumber}`,
    name: rc.sunkShipName,
    size: rc.sunkShipSize,
    positions: [],
    orientation: 'horizontal',
    hits: rc.sunkShipSize,
    isSunk: true,
  };
  setTimeout(() => showSunkAnimation(syntheticShip), 500);
}
```

**Step 7: Verify and commit**

Run: `cd web && npx tsc --noEmit && cd ../backend && npx tsc --noEmit`
Expected: No type errors

```bash
git add backend/src/battle/entities.ts backend/src/battle/translator.ts \
  web/src/pvp/entities.ts web/src/pvp/interactor.ts web/src/pages/Battle.tsx
git commit -m "feat(pvp): show sunk ship type to both attacker and defender"
```

---

## Task 3: ZK Proof Logs — Web UI Panel

**Files:**
- Create: `web/src/components/UI/ZKProofLog.tsx`
- Create: `web/src/components/UI/ZKProofLog.module.css`
- Modify: `web/src/pages/Battle.tsx` (integrate log panel)

**Step 1: Create ZKProofLog component**

```tsx
// web/src/components/UI/ZKProofLog.tsx
import React, { useState } from 'react';
import { COLORS, FONTS } from '../../shared/theme';
import styles from './ZKProofLog.module.css';

export interface ZKLogEntry {
  id: string;
  circuit: string;
  timeMs: number;
  sizeBytes: number;
  status: 'ok' | 'fail';
  timestamp: number;
  label: string;
}

interface Props {
  entries: ZKLogEntry[];
}

export function ZKProofLog({ entries }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className={styles.container}>
      <button className={styles.toggle} onClick={() => setExpanded(!expanded)}>
        ZK [{entries.length}] {expanded ? '▼' : '▲'}
      </button>
      {expanded && (
        <div className={styles.list}>
          {entries.map((e) => (
            <div key={e.id} className={`${styles.entry} ${e.status === 'fail' ? styles.entryFail : ''}`}>
              <span className={styles.circuit}>{e.circuit}</span>
              <span className={styles.time}>{(e.timeMs / 1000).toFixed(1)}s</span>
              <span className={styles.size}>{e.sizeBytes}B</span>
              <span className={e.status === 'ok' ? styles.ok : styles.fail}>
                {e.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create CSS module**

```css
/* web/src/components/UI/ZKProofLog.module.css */
.container {
  position: fixed;
  bottom: 12px;
  right: 12px;
  z-index: 100;
  font-family: 'Rajdhani', monospace;
  font-size: 11px;
}

.toggle {
  background: rgba(10, 14, 26, 0.9);
  border: 1px solid #f59e0b44;
  color: #f59e0b;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  letter-spacing: 1px;
}

.list {
  background: rgba(10, 14, 26, 0.95);
  border: 1px solid #f59e0b33;
  border-radius: 4px;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

.entry {
  display: flex;
  gap: 8px;
  padding: 2px 6px;
  border-bottom: 1px solid #ffffff0a;
  align-items: center;
}

.entryFail { color: #f87171; }
.circuit { color: #38bdf8; min-width: 80px; }
.time { color: #e0e6f0; min-width: 40px; text-align: right; }
.size { color: #94a3b8; min-width: 50px; text-align: right; }
.ok { color: #22c55e; font-weight: 600; }
.fail { color: #f87171; font-weight: 600; }
```

**Step 3: Integrate into Battle.tsx**

Add state for log entries and update `generateShotProof` to push entries:

```tsx
// Add import
import { ZKProofLog, ZKLogEntry } from '../components/UI/ZKProofLog';

// Add state (near line 69)
const [zkLogs, setZkLogs] = useState<ZKLogEntry[]>([]);

// In generateShotProof callback, replace .then/.catch to also push log entries:
// In .then():
setZkLogs(prev => [...prev, {
  id: `${label}-${Date.now()}`,
  circuit: 'shot_proof',
  timeMs: performance.now() - shotStart,
  sizeBytes: result.proof.length,
  status: 'ok',
  timestamp: Date.now(),
  label,
}]);

// In .catch():
setZkLogs(prev => [...prev, {
  id: `${label}-${Date.now()}`,
  circuit: 'shot_proof',
  timeMs: performance.now() - shotStart,
  sizeBytes: 0,
  status: 'fail',
  timestamp: Date.now(),
  label,
}]);

// Add component before closing </PageShell> (after SunkShipModal):
<ZKProofLog entries={zkLogs} />
```

**Step 4: Verify and commit**

Run: `cd web && npx tsc --noEmit`

```bash
git add web/src/components/UI/ZKProofLog.tsx web/src/components/UI/ZKProofLog.module.css web/src/pages/Battle.tsx
git commit -m "feat(zk): add ZK proof log panel to battle UI"
```

---

## Task 4: Backend Proof Validation Logs

**Files:**
- Modify: `backend/src/board-validity/verify-interactor.ts`
- Modify: `backend/src/shot-proof/verify-interactor.ts`
- Modify: `backend/src/turns-proof/verify-interactor.ts`
- Modify: `backend/src/battle/translator.ts` (add timing to inline verification)

**Step 1: Add structured logging to each verify-interactor**

For each verify-interactor file, wrap the verification in timing:

```typescript
// Example for board-validity/verify-interactor.ts:
export async function verifyBoardValidity(/* ... existing params ... */) {
  const startMs = performance.now();
  // ... existing verification logic ...
  const elapsedMs = (performance.now() - startMs).toFixed(1);
  const proofSizeBytes = proof.length;

  console.log(
    `[VERIFY] player=${playerPk?.slice(0, 8) ?? 'unknown'} circuit=board_validity ` +
    `size=${proofSizeBytes}B time=${elapsedMs}ms valid=${valid}`
  );

  return { valid };
}
```

Apply the same pattern to `shot-proof/verify-interactor.ts` and `turns-proof/verify-interactor.ts`.

**Step 2: Add player context to verify endpoints**

Each verify-translator endpoint should extract the player public key (from request body or auth header) and pass it to the interactor for logging.

**Step 3: Verify and commit**

Run: `cd backend && npx tsc --noEmit`

```bash
git add backend/src/board-validity/verify-interactor.ts \
  backend/src/shot-proof/verify-interactor.ts \
  backend/src/turns-proof/verify-interactor.ts
git commit -m "feat(logs): add structured timing logs to proof verification"
```

---

## Task 5: Supabase Database Setup

**Files:**
- Create: `backend/supabase/` directory (via `npx supabase init`)
- Create: `backend/supabase/migrations/001_initial_schema.sql`
- Create: `backend/src/shared/supabase.ts` (client singleton)
- Modify: `backend/package.json` (add @supabase/supabase-js)
- Create: `backend/.env.example` (document env vars)

**Step 1: Initialize Supabase in backend**

```bash
cd backend
npx supabase init
```

**Step 2: Install Supabase client**

```bash
cd backend
npm install @supabase/supabase-js
```

**Step 3: Create migration file**

Create `backend/supabase/migrations/001_initial_schema.sql`:

```sql
-- Matches table
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

-- Attacks table
CREATE TABLE attacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  attacker_pk TEXT NOT NULL,
  row INTEGER NOT NULL,
  col INTEGER NOT NULL,
  result TEXT,
  turn_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attacks_match ON attacks(match_id);

-- Proof logs table
CREATE TABLE proof_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  player_pk TEXT NOT NULL,
  circuit TEXT NOT NULL,
  proof_size_bytes INTEGER,
  generation_time_ms REAL,
  verification_time_ms REAL,
  valid BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_proof_logs_match ON proof_logs(match_id);
CREATE INDEX idx_proof_logs_player ON proof_logs(player_pk);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_pk TEXT NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  amount_xlm NUMERIC(18,7) NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_player ON payments(player_pk);

-- Player stats table
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

**Step 4: Create Supabase client singleton**

```typescript
// backend/src/shared/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    }
    client = createClient(url, key);
  }
  return client;
}
```

**Step 5: Update .env.example**

```
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Stellar (payment)
STELLAR_SERVER_SEED=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Server
PORT=3001
```

**Step 6: Integrate persistence into match lifecycle**

Create `backend/src/shared/persistence.ts` with helper functions:

```typescript
import { getSupabase } from './supabase.js';

export async function persistMatch(match: { id: string; gridSize: number; player1Pk: string; player2Pk?: string }) {
  const sb = getSupabase();
  await sb.from('matches').upsert({
    id: match.id,
    grid_size: match.gridSize,
    player1_pk: match.player1Pk,
    player2_pk: match.player2Pk,
    status: 'placing',
  });
}

export async function persistAttack(matchId: string, attackerPk: string, row: number, col: number, result: string, turnNumber: number) {
  const sb = getSupabase();
  await sb.from('attacks').insert({
    match_id: matchId,
    attacker_pk: attackerPk,
    row, col, result, turn_number: turnNumber,
  });
}

export async function persistMatchEnd(matchId: string, winnerPk: string, reason: string, turnCount: number) {
  const sb = getSupabase();
  await sb.from('matches').update({
    winner_pk: winnerPk,
    reason,
    turn_count: turnCount,
    status: 'finished',
    finished_at: new Date().toISOString(),
  }).eq('id', matchId);
}

export async function persistProofLog(log: {
  matchId?: string; playerPk: string; circuit: string;
  proofSizeBytes: number; verificationTimeMs: number; valid: boolean;
}) {
  const sb = getSupabase();
  await sb.from('proof_logs').insert({
    match_id: log.matchId,
    player_pk: log.playerPk,
    circuit: log.circuit,
    proof_size_bytes: log.proofSizeBytes,
    verification_time_ms: log.verificationTimeMs,
    valid: log.valid,
  });
}

export async function upsertPlayerStats(playerPk: string, won: boolean) {
  const sb = getSupabase();
  const { data } = await sb.from('player_stats').select().eq('player_pk', playerPk).single();

  if (data) {
    await sb.from('player_stats').update({
      wins: won ? data.wins + 1 : data.wins,
      losses: won ? data.losses : data.losses + 1,
      total_matches: data.total_matches + 1,
      updated_at: new Date().toISOString(),
    }).eq('player_pk', playerPk);
  } else {
    await sb.from('player_stats').insert({
      player_pk: playerPk,
      wins: won ? 1 : 0,
      losses: won ? 0 : 1,
      total_matches: 1,
    });
  }
}
```

**Step 7: Wire persistence into battle translator**

In `backend/src/battle/translator.ts`, add persistence calls:
- On `placement:ready` when both ready → `persistMatch()`
- On `battle:shot_result` → `persistAttack()`
- On win/forfeit/timeout → `persistMatchEnd()` + `upsertPlayerStats()`

Use `void` prefix for fire-and-forget async (don't block socket events):

```typescript
import { persistMatch, persistAttack, persistMatchEnd, upsertPlayerStats } from '../shared/persistence.js';

// In placement:ready bothReady block:
void persistMatch({
  id: match.id,
  gridSize: match.gridSize,
  player1Pk: match.player1.publicKey,
  player2Pk: match.player2!.publicKey,
});

// In battle:shot_result after recordShotResult:
void persistAttack(match.id, publicKey === match.player1.publicKey ? match.player2!.publicKey : match.player1.publicKey, data.row, data.col, data.result, match.turnNumber);

// In endMatch calls (win/forfeit/timeout):
void persistMatchEnd(match.id, winnerKey, reason, match.turnNumber);
void upsertPlayerStats(winnerKey, true);
void upsertPlayerStats(loserKey, false);
```

**Step 8: Verify and commit**

```bash
cd backend && npx tsc --noEmit
git add backend/supabase/ backend/src/shared/supabase.ts backend/src/shared/persistence.ts \
  backend/package.json backend/package-lock.json backend/.env.example \
  backend/src/battle/translator.ts
git commit -m "feat(db): add Supabase integration with match persistence"
```

---

## Task 6: XLM Payment Gate for PvP

**Files:**
- Create: `backend/src/payment/interactor.ts`
- Create: `backend/src/payment/translator.ts`
- Create: `backend/src/payment/entities.ts`
- Modify: `backend/src/app.ts` (add payment route)
- Modify: `backend/src/matchmaking/translator.ts` (require payment)
- Modify: `backend/package.json` (add @stellar/stellar-sdk)
- Modify: `web/src/pvp/interactor.ts` (send txHash)
- Modify: `web/src/pages/PvpMode.tsx` (payment step before matchmaking)
- Modify: `web/src/wallet/interactor.ts` (add sendPayment function)

**Step 1: Install Stellar SDK on backend**

```bash
cd backend
npm install @stellar/stellar-sdk
```

**Step 2: Create payment entities**

```typescript
// backend/src/payment/entities.ts
export const PVP_FEE_XLM = '0.001';

// Track verified payments (in-memory, also persisted to Supabase)
export const verifiedPayments = new Map<string, { txHash: string; playerPk: string; timestamp: number }>();
```

**Step 3: Create payment interactor**

```typescript
// backend/src/payment/interactor.ts
import { Horizon } from '@stellar/stellar-sdk';
import { Keypair } from '@stellar/stellar-sdk';
import { PVP_FEE_XLM, verifiedPayments } from './entities.js';
import { getSupabase } from '../shared/supabase.js';

const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');

let serverPublicKey: string | null = null;

export function initServerWallet(): string {
  const seed = process.env.STELLAR_SERVER_SEED;
  if (!seed) throw new Error('STELLAR_SERVER_SEED not set');
  const kp = Keypair.fromSecret(seed);
  serverPublicKey = kp.publicKey();
  console.log(`[payment] Server wallet: ${serverPublicKey}`);
  return serverPublicKey;
}

export function getServerAddress(): string {
  if (!serverPublicKey) throw new Error('Server wallet not initialized');
  return serverPublicKey;
}

export async function verifyPayment(txHash: string, playerPk: string): Promise<{ valid: boolean; error?: string }> {
  // Check if already used
  if (verifiedPayments.has(txHash)) {
    return { valid: false, error: 'Transaction already used' };
  }

  try {
    const tx = await horizon.transactions().transaction(txHash).call();
    const ops = await horizon.operations().forTransaction(txHash).call();

    const paymentOp = ops.records.find((op: any) =>
      op.type === 'payment' &&
      op.asset_type === 'native' &&
      op.to === serverPublicKey &&
      parseFloat(op.amount) >= parseFloat(PVP_FEE_XLM)
    );

    if (!paymentOp) {
      return { valid: false, error: 'No valid payment found in transaction' };
    }

    // Mark as used
    verifiedPayments.set(txHash, { txHash, playerPk, timestamp: Date.now() });

    // Persist to Supabase
    try {
      const sb = getSupabase();
      await sb.from('payments').insert({
        player_pk: playerPk,
        tx_hash: txHash,
        amount_xlm: parseFloat((paymentOp as any).amount),
        status: 'verified',
      });
    } catch (e) { /* log but don't fail */ }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: `Horizon error: ${err.message}` };
  }
}

export function hasValidPayment(playerPk: string): boolean {
  for (const [, payment] of verifiedPayments) {
    if (payment.playerPk === playerPk) return true;
  }
  return false;
}

export function consumePayment(playerPk: string): void {
  for (const [hash, payment] of verifiedPayments) {
    if (payment.playerPk === playerPk) {
      verifiedPayments.delete(hash);
      return;
    }
  }
}
```

**Step 4: Create payment translator (HTTP endpoint)**

```typescript
// backend/src/payment/translator.ts
import { Router } from 'express';
import { getServerAddress, verifyPayment } from './interactor.js';

const router = Router();

router.get('/address', (_req, res) => {
  res.json({ address: getServerAddress(), feeXlm: '0.001' });
});

router.post('/verify', async (req, res) => {
  const { txHash, playerPk } = req.body;
  if (!txHash || !playerPk) {
    return res.status(400).json({ error: 'txHash and playerPk required' });
  }
  const result = await verifyPayment(txHash, playerPk);
  res.json(result);
});

export { router as paymentRouter };
```

**Step 5: Register payment route in app.ts**

```typescript
import { paymentRouter } from './payment/translator.js';
// In app setup:
app.use('/api/payment', paymentRouter);
```

**Step 6: Init server wallet in server.ts**

```typescript
import { initServerWallet } from './payment/interactor.js';
// After circuit loading:
initServerWallet();
```

**Step 7: Gate matchmaking with payment verification**

In `backend/src/matchmaking/translator.ts`, require txHash:

```typescript
import { hasValidPayment, consumePayment } from '../payment/interactor.js';

// In 'match:find_random' handler, before findRandomMatch():
socket.on('match:find_random', (data: { gridSize?: number; txHash?: string }) => {
  // Verify payment
  if (!hasValidPayment(publicKey)) {
    socket.emit('match:error', { message: 'Payment required to play PvP' });
    return;
  }
  // ... existing matchmaking logic ...
  // On successful match:
  if (result.type === 'matched') {
    consumePayment(publicKey);
    consumePayment(result.match.player2!.publicKey);
    // ... emit match:found ...
  }
});
```

Also gate `match:create_friend` similarly.

**Step 8: Add payment flow to frontend**

In `web/src/wallet/interactor.ts`, add `sendPayment`:

```typescript
export async function sendPayment(secretKey: string, destination: string, amountXlm: string): Promise<string> {
  const { Keypair, TransactionBuilder, Networks, Operation, Asset, Horizon } = await import('@stellar/stellar-sdk');
  const server = new Horizon.Server('https://horizon-testnet.stellar.org');
  const kp = Keypair.fromSecret(secretKey);
  const account = await server.loadAccount(kp.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.payment({
      destination,
      asset: Asset.native(),
      amount: amountXlm,
    }))
    .setTimeout(30)
    .build();

  tx.sign(kp);
  const result = await server.submitTransaction(tx);
  return result.hash;
}
```

Install stellar SDK on frontend too:

```bash
cd web
npm install @stellar/stellar-sdk
```

**Step 9: Add payment step in PvpMode.tsx**

After wallet unlock, before showing match options, add payment step:
- Fetch server address from `GET /api/payment/address`
- Send 0.001 XLM using `sendPayment()`
- Verify with `POST /api/payment/verify`
- Then proceed to matchmaking

**Step 10: Verify and commit**

```bash
cd backend && npx tsc --noEmit
cd ../web && npx tsc --noEmit
git add backend/src/payment/ backend/src/app.ts backend/src/server.ts \
  backend/src/matchmaking/translator.ts backend/package.json \
  web/src/wallet/interactor.ts web/src/pages/PvpMode.tsx web/package.json
git commit -m "feat(payment): add 0.001 XLM payment gate for PvP matches"
```

---

## Task 7: Responsiveness — All Pages

**Files:**
- Modify: All pages in `web/src/pages/` (15 files)
- Modify: `web/src/components/UI/PageShell.tsx` (ensure responsive max-width)

**Step 1: Audit PageShell**

Read `PageShell.tsx` and ensure it uses `useResponsive()` for dynamic max-width:
- Mobile: `LAYOUT.maxContentWidth` (420px)
- Tablet: `LAYOUT.maxContentWidthTablet` (600px)
- Desktop: `LAYOUT.maxContentWidthDesktop` (800px)

**Step 2: Review and fix each page group**

**Group A — Simple pages (center content, scale):**
- `Splash.tsx`, `Login.tsx` — Ensure centered with max-width container
- `Settings.tsx`, `Profile.tsx` — Card layout, wider on desktop
- `Wallet.tsx`, `WalletSetup.tsx` — Form layout, centered

Pattern for each:
```tsx
const { isMobile, isDesktop } = useResponsive();
// Use PageShell maxWidth and let it handle responsive sizing
```

**Group B — List pages:**
- `MatchHistory.tsx`, `MatchDetail.tsx` — Scrollable list, wider cards on desktop
- `Menu.tsx` — Button grid, 2 columns on desktop

**Group C — PvP pages:**
- `PvpMode.tsx` — PIN input centered, options wider on desktop
- `PvpFriend.tsx` — Code input/display, centered
- `PvpLobby.tsx` — Radar spinner centered (already fine)

**Group D — Game pages:**
- `Battle.tsx` — Already responsive ✓
- `Placement.tsx` — Ship selector + grid, side-by-side on desktop
- `GameOver.tsx` — Stats cards wider on desktop
- `Tutorial.tsx` — Content scrollable, wider on desktop

For each page:
1. Import `useResponsive` if not already
2. Ensure content is wrapped in responsive container
3. Test at 375px (mobile), 768px (tablet), 1200px (desktop)

**Step 3: Commit per group**

```bash
git commit -m "ui(responsive): improve Splash, Login, Settings, Profile, Wallet pages"
git commit -m "ui(responsive): improve Menu, MatchHistory, MatchDetail pages"
git commit -m "ui(responsive): improve PvP, Placement, GameOver, Tutorial pages"
```

---

## Task 8: Supabase Migration Guide

**Files:**
- Create: `docs/plans/2026-02-23-supabase-migration-guide.md`

**Step 1: Write migration document**

Cover these sections:

1. **Overview** — Current Express+Socket.io → Supabase Edge Functions + Realtime
2. **Component Mapping:**
   - Express REST → Supabase Edge Functions (Deno)
   - Socket.io → Supabase Realtime Channels (Broadcast)
   - Ed25519 Auth → Supabase Auth (custom JWT provider)
   - In-memory Maps → PostgreSQL tables (already created)
3. **Edge Functions Migration:**
   - Each proof endpoint → separate Edge Function
   - Payment verification → Edge Function
   - Circuit loading strategy (bundled WASM vs external)
4. **Realtime Migration:**
   - Match rooms → Realtime Channels
   - Turn events → Broadcast messages
   - Grace period → Presence tracking
5. **RLS Policies:**
   - `matches`: Players can only see their own matches
   - `attacks`: Read-only for match participants
   - `payments`: Players can only see their own payments
   - `player_stats`: Public read, auth write
6. **Environment Variables:**
   - Map current env vars to Supabase Vault secrets
7. **Step-by-step Checklist:**
   - [ ] Create Supabase project
   - [ ] Run migrations
   - [ ] Deploy Edge Functions
   - [ ] Configure Realtime channels
   - [ ] Set up RLS policies
   - [ ] Update frontend WebSocket URL
   - [ ] Test end-to-end
   - [ ] DNS + custom domain

**Step 2: Commit**

```bash
git add docs/plans/2026-02-23-supabase-migration-guide.md
git commit -m "docs: add Supabase migration guide"
```

---

## Execution Order

Tasks can be partially parallelized:

```
Task 1 (matchmaking fix) ──────────────────── can run independently
Task 2 (sunk ship) ────────────────────────── can run independently
Task 3 (ZK web logs) ──────────────────────── can run independently
Task 4 (backend proof logs) ────────────────── can run independently
Task 5 (Supabase DB) ──────────────────────── prerequisite for Task 6
Task 6 (XLM payment) ──────────────────────── depends on Task 5
Task 7 (responsive) ───────────────────────── can run independently
Task 8 (migration doc) ────────────────────── depends on Task 5
```

**Recommended serial order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
