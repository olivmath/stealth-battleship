# Production ZK PvP + Arcade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all mocks, wire real ZK proof verification in PvP, implement BATTLE token payment flow with Horizon SSE, and make Arcade fully local.

**Architecture:** Backend (Express + Socket.io) verifies ZK proofs synchronously in PvP, manages BATTLE Stellar Custom Asset (issue/clawback), persists everything to Supabase. Web client generates all proofs via WASM (WebWasmZKProvider only). Arcade mode has zero backend calls.

**Tech Stack:** Noir 1.0.0-beta.18, bb.js, Stellar SDK (Custom Assets + Horizon SSE), Supabase, Socket.io, Express

---

## Task 1: Cleanup — Delete Backend Proof Generation Files

**Files:**
- Delete: `backend/src/board-validity/adapter.ts`
- Delete: `backend/src/board-validity/interactor.ts`
- Delete: `backend/src/board-validity/translator.ts`
- Delete: `backend/src/shot-proof/adapter.ts`
- Delete: `backend/src/shot-proof/interactor.ts`
- Delete: `backend/src/shot-proof/translator.ts`
- Delete: `backend/src/turns-proof/translator.ts`
- Modify: `backend/src/app.ts`

**Step 1: Delete the 7 proof generation files**

```bash
rm backend/src/board-validity/adapter.ts
rm backend/src/board-validity/interactor.ts
rm backend/src/board-validity/translator.ts
rm backend/src/shot-proof/adapter.ts
rm backend/src/shot-proof/interactor.ts
rm backend/src/shot-proof/translator.ts
rm backend/src/turns-proof/translator.ts
```

**Step 2: Remove prove route imports and mounts from app.ts**

Edit `backend/src/app.ts` — remove these imports:
```ts
import boardValidityRouter from './board-validity/translator.js';
import shotProofRouter from './shot-proof/translator.js';
import turnsProofRouter from './turns-proof/translator.js';
```

Remove these route mounts:
```ts
// Proof generation routes
app.use('/api/prove', boardValidityRouter);
app.use('/api/prove', shotProofRouter);
app.use('/api/prove', turnsProofRouter);
```

**Step 3: Verify backend compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove backend proof generation endpoints (now client-only WASM)"
```

---

## Task 2: Cleanup — Delete Web ServerZKProvider + InMemoryGameRepository

**Files:**
- Delete: `web/src/zk/adapter.ts`
- Delete: `web/src/game/adapter.ts`
- Modify: `web/src/App.tsx`

**Step 1: Delete ServerZKProvider and InMemoryGameRepository**

```bash
rm web/src/zk/adapter.ts
rm web/src/game/adapter.ts
```

**Step 2: Simplify App.tsx — remove ZK mode selection**

In `web/src/App.tsx`, remove:
- `ZK_MODE` const and `VITE_ZK_MODE` env var reference
- `ZK_SERVER_URL` const and `VITE_ZK_SERVER_URL` env var reference
- `ServerZKProvider` import
- The `if (ZK_MODE === 'server')` branch

Replace the ZK initialization block with:
```ts
import { WebWasmZKProvider } from './zk/webWasmProvider';

// In the useEffect:
const provider = new WebWasmZKProvider();
initZK(provider)
  .then(() => setZkReady(true))
  .catch((err) => {
    console.error('ZK init failed:', err);
    setZkReady(true); // graceful — arcade still works without ZK
  });
```

**Step 3: Verify web compiles**

Run: `cd web && npx tsc --noEmit`
Expected: No errors (or only pre-existing warnings)

**Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove ServerZKProvider and InMemoryGameRepository (WASM-only ZK)"
```

---

## Task 3: Supabase Schema — Add pending_payments Table + Extend payments

**Files:**
- Create: `backend/supabase/migrations/002_pending_payments_and_battle_token.sql`

**Step 1: Write the migration**

```sql
-- Pending payments for memo-based payment detection
CREATE TABLE pending_payments (
  memo TEXT PRIMARY KEY,
  player_pk TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_pending_payments_player ON pending_payments(player_pk);
CREATE INDEX idx_pending_payments_status ON pending_payments(status);

-- Add battle token tracking to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS battle_token_tx_hash TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS memo TEXT;

-- Add proof column to attacks for storing shot proofs
ALTER TABLE attacks ADD COLUMN IF NOT EXISTS proof BYTEA;
```

**Step 2: Apply migration to Supabase**

Use the Supabase MCP tool `apply_migration` with the SQL above.

**Step 3: Commit**

```bash
git add backend/supabase/migrations/002_pending_payments_and_battle_token.sql
git commit -m "feat: add pending_payments table and battle_token columns"
```

---

## Task 4: Backend Payment — BATTLE Token Asset Setup + Issuer

**Files:**
- Create: `backend/src/payment/stellar-asset.ts`
- Modify: `backend/src/payment/entities.ts`

**Step 1: Define BATTLE asset constants in entities.ts**

Replace `backend/src/payment/entities.ts` entirely:
```ts
export const PVP_FEE_XLM = '0.001';
export const BATTLE_ASSET_CODE = 'BATTLE';
```

The `verifiedPayments` Map is deleted — no more in-memory tracking.

**Step 2: Create stellar-asset.ts — BATTLE token operations**

Create `backend/src/payment/stellar-asset.ts`:
```ts
import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { BATTLE_ASSET_CODE } from './entities.js';
import { c } from '../log.js';

const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');

let serverKeypair: Keypair | null = null;
let battleAsset: Asset | null = null;

export function initStellarAsset(): { publicKey: string; asset: Asset } {
  const secret = process.env.STELLAR_SERVER_SECRET;
  if (!secret) throw new Error('STELLAR_SERVER_SECRET not set');
  serverKeypair = Keypair.fromSecret(secret);
  battleAsset = new Asset(BATTLE_ASSET_CODE, serverKeypair.publicKey());
  console.log(c.cyan('[stellar]') + ` Issuer: ${serverKeypair.publicKey()}`);
  console.log(c.cyan('[stellar]') + ` Asset: ${BATTLE_ASSET_CODE}`);
  return { publicKey: serverKeypair.publicKey(), asset: battleAsset };
}

export function getServerKeypair(): Keypair {
  if (!serverKeypair) throw new Error('Stellar asset not initialized');
  return serverKeypair;
}

export function getBattleAsset(): Asset {
  if (!battleAsset) throw new Error('Stellar asset not initialized');
  return battleAsset;
}

export function getServerPublicKey(): string {
  return getServerKeypair().publicKey();
}

/**
 * Setup issuer account with required flags for clawback.
 * Call once when first deploying. Idempotent.
 */
export async function setupIssuerFlags(): Promise<void> {
  const kp = getServerKeypair();
  const account = await horizon.loadAccount(kp.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.setOptions({
        setFlags:
          (1 << 0) | // AUTH_REQUIRED
          (1 << 1) | // AUTH_REVOCABLE
          (1 << 3),  // AUTH_CLAWBACK_ENABLED (flag 8 = bit 3)
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(kp);
  await horizon.submitTransaction(tx);
  console.log(c.cyan('[stellar]') + ' Issuer flags set: AUTH_REQUIRED + AUTH_REVOCABLE + AUTH_CLAWBACK_ENABLED');
}

/**
 * Authorize a trustline and issue 1 BATTLE token to a player.
 */
export async function issueBattleToken(playerPk: string): Promise<string> {
  const kp = getServerKeypair();
  const asset = getBattleAsset();
  const account = await horizon.loadAccount(kp.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.setTrustLineFlags({
        trustor: playerPk,
        asset,
        flags: { authorized: true },
      })
    )
    .addOperation(
      Operation.payment({
        destination: playerPk,
        asset,
        amount: '1',
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(kp);
  const result = await horizon.submitTransaction(tx);
  const txHash = result.hash;
  console.log(c.cyan('[stellar]') + ` Issued 1 BATTLE to ${playerPk.slice(0, 8)}... tx: ${txHash}`);
  return txHash;
}

/**
 * Check if player holds >= 1 BATTLE token on-chain.
 */
export async function hasBattleToken(playerPk: string): Promise<boolean> {
  try {
    const account = await horizon.loadAccount(playerPk);
    const balance = account.balances.find(
      (b: any) => b.asset_code === BATTLE_ASSET_CODE && b.asset_issuer === getServerPublicKey()
    );
    return balance ? parseFloat((balance as any).balance) >= 1 : false;
  } catch {
    return false;
  }
}

/**
 * Clawback 1 BATTLE token from player.
 */
export async function clawbackBattleToken(playerPk: string): Promise<string> {
  const kp = getServerKeypair();
  const asset = getBattleAsset();
  const account = await horizon.loadAccount(kp.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.clawback({
        from: playerPk,
        asset,
        amount: '1',
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(kp);
  const result = await horizon.submitTransaction(tx);
  console.log(c.cyan('[stellar]') + ` Clawback 1 BATTLE from ${playerPk.slice(0, 8)}... tx: ${result.hash}`);
  return result.hash;
}
```

**Step 3: Verify compiles**

Run: `cd backend && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add backend/src/payment/stellar-asset.ts backend/src/payment/entities.ts
git commit -m "feat: BATTLE Stellar Custom Asset — issue, check, clawback operations"
```

---

## Task 5: Backend Payment — Horizon SSE Stream + Memo Flow

**Files:**
- Rewrite: `backend/src/payment/interactor.ts`
- Rewrite: `backend/src/payment/translator.ts`

**Step 1: Rewrite payment interactor with SSE + memo**

Replace `backend/src/payment/interactor.ts` entirely:
```ts
import { Horizon } from '@stellar/stellar-sdk';
import { getSupabase } from '../shared/supabase.js';
import { getServerPublicKey, issueBattleToken, hasBattleToken, clawbackBattleToken } from './stellar-asset.js';
import { PVP_FEE_XLM } from './entities.js';
import { c } from '../log.js';
import crypto from 'crypto';

const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');

/**
 * Generate a unique memo and save as pending payment.
 */
export async function generateMemo(playerPk: string): Promise<string> {
  const memo = `BZK-${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min TTL

  const sb = getSupabase();
  await sb.from('pending_payments').insert({
    memo,
    player_pk: playerPk,
    status: 'pending',
    expires_at: expiresAt,
  });

  console.log(c.cyan('[payment]') + ` Memo generated: ${memo} for ${playerPk.slice(0, 8)}...`);
  return memo;
}

/**
 * Start Horizon SSE stream listening for payments to the server address.
 */
export function startPaymentStream(): void {
  const serverPk = getServerPublicKey();

  console.log(c.cyan('[payment]') + ' Starting Horizon SSE payment stream...');

  horizon
    .payments()
    .forAccount(serverPk)
    .cursor('now')
    .stream({
      onmessage: async (payment: any) => {
        if (payment.type !== 'payment') return;
        if (payment.asset_type !== 'native') return;
        if (parseFloat(payment.amount) < parseFloat(PVP_FEE_XLM)) return;

        // Get the transaction to read memo
        try {
          const tx = await horizon.transactions().transaction(payment.transaction_hash).call();
          const memo = tx.memo;
          if (!memo || !memo.startsWith('BZK-')) return;

          console.log(c.cyan('[payment]') + ` Detected payment: ${payment.amount} XLM, memo: ${memo}, from: ${payment.from.slice(0, 8)}...`);

          // Look up pending payment
          const sb = getSupabase();
          const { data: pending } = await sb
            .from('pending_payments')
            .select()
            .eq('memo', memo)
            .eq('status', 'pending')
            .single();

          if (!pending) {
            console.log(c.yellow('[payment]') + ` No pending payment for memo: ${memo}`);
            return;
          }

          if (new Date(pending.expires_at) < new Date()) {
            await sb.from('pending_payments').update({ status: 'expired' }).eq('memo', memo);
            console.log(c.yellow('[payment]') + ` Memo expired: ${memo}`);
            return;
          }

          // Issue BATTLE token
          const tokenTxHash = await issueBattleToken(pending.player_pk);

          // Update pending payment status
          await sb.from('pending_payments').update({ status: 'matched' }).eq('memo', memo);

          // Record in payments table
          await sb.from('payments').insert({
            player_pk: pending.player_pk,
            tx_hash: payment.transaction_hash,
            amount_xlm: parseFloat(payment.amount),
            memo,
            battle_token_tx_hash: tokenTxHash,
            status: 'completed',
          });

          console.log(c.cyan('[payment]') + ` BATTLE token issued to ${pending.player_pk.slice(0, 8)}... (token tx: ${tokenTxHash.slice(0, 12)}...)`);
        } catch (err: any) {
          console.error(c.red('[payment]') + ` SSE handler error: ${err.message}`);
        }
      },
      onerror: (err: any) => {
        console.error(c.red('[payment]') + ` SSE stream error: ${err?.message || err}`);
      },
    });
}

/**
 * Check if player has a BATTLE token on-chain.
 */
export async function playerHasBattleToken(playerPk: string): Promise<boolean> {
  return hasBattleToken(playerPk);
}

/**
 * Consume (clawback) BATTLE token when player enters a match.
 */
export async function consumeBattleToken(playerPk: string): Promise<string> {
  return clawbackBattleToken(playerPk);
}
```

**Step 2: Rewrite payment translator (REST endpoints)**

Replace `backend/src/payment/translator.ts` entirely:
```ts
import { Router } from 'express';
import { getServerPublicKey } from './stellar-asset.js';
import { generateMemo, playerHasBattleToken } from './interactor.js';
import { PVP_FEE_XLM, BATTLE_ASSET_CODE } from './entities.js';

const router = Router();

// GET /api/payment/address — server address + fee info
router.get('/address', (_req, res) => {
  try {
    res.json({
      address: getServerPublicKey(),
      feeXlm: PVP_FEE_XLM,
      assetCode: BATTLE_ASSET_CODE,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/memo — generate unique memo for player
router.post('/memo', async (req, res) => {
  const { playerPk } = req.body;
  if (!playerPk) {
    res.status(400).json({ error: 'playerPk required' });
    return;
  }
  try {
    const memo = await generateMemo(playerPk);
    res.json({ memo, expiresInSeconds: 600 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payment/status/:playerPk — check if player has BATTLE token
router.get('/status/:playerPk', async (req, res) => {
  try {
    const hasToken = await playerHasBattleToken(req.params.playerPk);
    res.json({ hasToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as paymentRouter };
```

**Step 3: Update server.ts — init stellar asset + start SSE stream**

In `backend/src/server.ts`, replace `initServerWallet()` with:
```ts
import { initStellarAsset, setupIssuerFlags } from './payment/stellar-asset.js';
import { startPaymentStream } from './payment/interactor.js';

// In main():
try {
  initStellarAsset();
  await setupIssuerFlags();
  startPaymentStream();
} catch (err: any) {
  console.log(c.yellow('[payment]') + ` Stellar not initialized: ${err.message}`);
  console.log(c.yellow('[payment]') + ' PvP payment gate will be unavailable');
}
```

Remove the old `initServerWallet` import.

**Step 4: Update matchmaking to use on-chain BATTLE token check**

In `backend/src/matchmaking/translator.ts`, replace:
- `hasValidPayment(pk)` → `await playerHasBattleToken(pk)`
- `consumePayment(pk)` → `await consumeBattleToken(pk)`
- Update imports accordingly

**Step 5: Remove old /verify endpoint**

In `backend/src/app.ts`, the old `POST /api/payment/verify` is already gone since we rewrote `translator.ts`. No action needed.

**Step 6: Verify compiles**

Run: `cd backend && npx tsc --noEmit`

**Step 7: Commit**

```bash
git add backend/src/payment/ backend/src/server.ts backend/src/matchmaking/translator.ts backend/src/app.ts
git commit -m "feat: BATTLE token payment flow — Horizon SSE, memo-based detection, on-chain token check"
```

---

## Task 6: Backend Battle — Wire board_validity Verification on placement:ready

**Files:**
- Modify: `backend/src/battle/translator.ts`

**Step 1: Add board_validity verification to placement:ready handler**

In `backend/src/battle/translator.ts`, add imports at top:
```ts
import { createBoardValidityVerifyAdapter } from '../board-validity/verify-adapter.js';
import { verifyBoardValidity } from '../board-validity/verify-interactor.js';
import { persistProofLog } from '../shared/persistence.js';
```

Create the adapter once at module level:
```ts
const boardValidityVerify = createBoardValidityVerifyAdapter();
```

In the `placement:ready` handler, replace the TODO comment block with:
```ts
// Verify board_validity proof server-side
const verifyStart = Date.now();
const shipSizes = getShipSizesForGrid(match.gridSize).map(String);
const publicInputs = [data.boardHash, ...shipSizes];

try {
  const circuit = getCircuit('board_validity');
  const valid = await circuit.backend.verifyProof({
    proof: new Uint8Array(data.proof),
    publicInputs,
  });

  const verifyTimeMs = Date.now() - verifyStart;
  await persistProofLog({
    matchId: match.id,
    playerPk: publicKey,
    circuit: 'board_validity',
    proofSizeBytes: data.proof.length,
    verificationTimeMs: verifyTimeMs,
    valid,
  });

  if (!valid) {
    endMatch(match, opponentPk, 'invalid_proof');
    io.to(match.player1.socketId).to(match.player2!.socketId)
      .emit('battle:game_over', { winner: opponentPk, reason: 'invalid_proof' });
    await persistMatchEnd(match.id, opponentPk, 'invalid_proof', match.turnNumber);
    return;
  }

  console.log(c.blue('[battle]') + ` board_validity verified for ${publicKey.slice(0, 8)}... (${verifyTimeMs}ms)`);
} catch (err: any) {
  console.error(c.red('[battle]') + ` board_validity verify error: ${err.message}`);
  socket.emit('placement:error', { error: 'Proof verification failed' });
  return;
}
```

**Step 2: Add import for getCircuit**

```ts
import { getCircuit } from '../shared/circuits.js';
```

**Step 3: Verify compiles**

Run: `cd backend && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add backend/src/battle/translator.ts
git commit -m "feat: wire board_validity proof verification on placement:ready"
```

---

## Task 7: Backend Battle — Wire shot_proof Verification on battle:shot_result

**Files:**
- Modify: `backend/src/battle/translator.ts`

**Step 1: Add shot_proof verification to battle:shot_result handler**

In the `battle:shot_result` handler, after the signature verification and before calling `recordShotResult`, add:
```ts
// Verify shot_proof server-side
const verifyStart = Date.now();
const defenderBoardHash = publicKey === match.player1.publicKey
  ? match.player1BoardHash
  : match.player2BoardHash;

const shotPublicInputs = [
  defenderBoardHash!,
  String(data.row),
  String(data.col),
  data.result === 'hit' ? '1' : '0',
];

try {
  const circuit = getCircuit('shot_proof');
  const valid = await circuit.backend.verifyProof({
    proof: new Uint8Array(data.proof),
    publicInputs: shotPublicInputs,
  });

  const verifyTimeMs = Date.now() - verifyStart;
  await persistProofLog({
    matchId: match.id,
    playerPk: publicKey,
    circuit: 'shot_proof',
    proofSizeBytes: data.proof.length,
    verificationTimeMs: verifyTimeMs,
    valid,
  });

  if (!valid) {
    // Defender sent invalid proof — they lose
    const attackerPk = publicKey === match.player1.publicKey
      ? match.player2!.publicKey
      : match.player1.publicKey;
    endMatch(match, attackerPk, 'invalid_proof');
    io.to(match.player1.socketId).to(match.player2!.socketId)
      .emit('battle:game_over', { winner: attackerPk, reason: 'invalid_proof' });
    await persistMatchEnd(match.id, attackerPk, 'invalid_proof', match.turnNumber);
    await upsertPlayerStats(attackerPk, true);
    await upsertPlayerStats(publicKey, false);
    return;
  }

  console.log(c.blue('[battle]') + ` shot_proof verified for ${publicKey.slice(0, 8)}... (${verifyTimeMs}ms)`);
} catch (err: any) {
  console.error(c.red('[battle]') + ` shot_proof verify error: ${err.message}`);
  socket.emit('battle:error', { error: 'Shot proof verification failed' });
  return;
}
```

**Step 2: Verify compiles**

Run: `cd backend && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add backend/src/battle/translator.ts
git commit -m "feat: wire shot_proof verification on battle:shot_result — invalid proof = lose"
```

---

## Task 8: Backend Battle — Add battle:reveal + turns_proof Generation at Game End

**Files:**
- Modify: `backend/src/battle/translator.ts`
- Modify: `backend/src/battle/entities.ts`
- Modify: `backend/src/matchmaking/entities.ts` (add reveal tracking to MatchRoom)

**Step 1: Add reveal tracking to MatchRoom**

In `backend/src/matchmaking/entities.ts`, add to the `MatchRoom` interface:
```ts
player1Reveal?: { ships: ShipTuple[]; nonce: string };
player2Reveal?: { ships: ShipTuple[]; nonce: string };
```

**Step 2: Add reveal payload type to battle entities**

In `backend/src/battle/entities.ts`, add:
```ts
export interface RevealPayload {
  matchId: string;
  ships: ShipTuple[];
  nonce: string;
  timestamp: number;
  signature: string;
}
```

Import ShipTuple from shared entities.

**Step 3: Add battle:reveal handler in battle/translator.ts**

Register new socket handler:
```ts
socket.on('battle:reveal', async (data: RevealPayload) => {
  // Verify signature
  const authResult = verifyAction({ publicKey, action: 'battle:reveal', data: JSON.stringify({ matchId: data.matchId, ships: data.ships, nonce: data.nonce }), timestamp: data.timestamp, signature: data.signature });
  if (!authResult) { socket.emit('battle:error', { error: 'Invalid signature' }); return; }

  const match = getPlayerMatch(publicKey);
  if (!match || match.status !== 'finished') { socket.emit('battle:error', { error: 'Match not in finished state' }); return; }

  // Verify hash: poseidon2(ships, nonce) == boardHash
  const hashCircuit = getCircuit('hash_helper');
  const noirShips = data.ships.map(([r, c, s, h]) => [String(r), String(c), String(s), h]);
  const hashResult = await hashCircuit.noir.execute({ ships: noirShips, nonce: data.nonce });
  const computedHash = hashResult.returnValue as string;

  const expectedHash = publicKey === match.player1.publicKey ? match.player1BoardHash : match.player2BoardHash;

  if (computedHash !== expectedHash) {
    const opponentPk = publicKey === match.player1.publicKey ? match.player2!.publicKey : match.player1.publicKey;
    io.to(match.player1.socketId).to(match.player2!.socketId)
      .emit('battle:game_over', { winner: opponentPk, reason: 'invalid_reveal' });
    return;
  }

  // Store reveal
  if (publicKey === match.player1.publicKey) {
    match.player1Reveal = { ships: data.ships, nonce: data.nonce };
  } else {
    match.player2Reveal = { ships: data.ships, nonce: data.nonce };
  }

  console.log(c.blue('[battle]') + ` ${publicKey.slice(0, 8)}... revealed board`);

  // If both revealed, generate turns_proof
  if (match.player1Reveal && match.player2Reveal) {
    try {
      const { proveTurnsProof } = await import('../turns-proof/interactor.js');
      const { createTurnsProofAdapter } = await import('../turns-proof/adapter.js');
      const turnsAdapter = createTurnsProofAdapter();

      const shipSizes = getShipSizesForGrid(match.gridSize);

      // Separate attacks by player
      const p1Attacks = match.attacks.filter(a => a.attackerPk === match.player1.publicKey).map(a => [a.row, a.col] as [number, number]);
      const p2Attacks = match.attacks.filter(a => a.attackerPk === match.player2!.publicKey).map(a => [a.row, a.col] as [number, number]);

      const turnsResult = await proveTurnsProof({
        shipsPlayer: match.player1Reveal.ships,
        shipsAi: match.player2Reveal.ships,
        noncePlayer: match.player1Reveal.nonce,
        nonceAi: match.player2Reveal.nonce,
        boardHashPlayer: match.player1BoardHash!,
        boardHashAi: match.player2BoardHash!,
        attacksPlayer: p1Attacks,
        attacksAi: p2Attacks,
        nAttacksPlayer: p1Attacks.length,
        nAttacksAi: p2Attacks.length,
        shipSizes,
        winner: match.winner === match.player1.publicKey ? 1 : 2,
      }, turnsAdapter, `[battle:${match.id.slice(0, 8)}]`);

      await persistProofLog({
        matchId: match.id,
        playerPk: 'server',
        circuit: 'turns_proof',
        proofSizeBytes: turnsResult.proof.length,
        verificationTimeMs: 0,
        valid: true,
      });

      // TODO: Submit turns_proof to blockchain here
      const turnsProofHash = Array.from(turnsResult.proof.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join('');

      io.to(match.player1.socketId).to(match.player2!.socketId)
        .emit('battle:finalized', { turnsProofHash, txHash: 'pending' });

      console.log(c.blue('[battle]') + ` turns_proof generated for match ${match.id.slice(0, 8)}...`);
    } catch (err: any) {
      console.error(c.red('[battle]') + ` turns_proof generation error: ${err.message}`);
      io.to(match.player1.socketId).to(match.player2!.socketId)
        .emit('battle:finalized', { turnsProofHash: null, txHash: null, error: 'turns_proof generation failed' });
    }
  }
});
```

**Step 4: Verify compiles**

Run: `cd backend && npx tsc --noEmit`

**Step 5: Commit**

```bash
git add backend/src/battle/ backend/src/matchmaking/entities.ts
git commit -m "feat: add battle:reveal handler + server-side turns_proof generation"
```

---

## Task 9: Web PvP — Send Real shot_proof Instead of Empty Array

**Files:**
- Modify: `web/src/pages/Battle.tsx`
- Modify: `web/src/pvp/interactor.ts`

**Step 1: In Battle.tsx, generate shot_proof BEFORE sending result**

In the PvP incoming_attack handler, change the flow from:
```ts
// Old: send result immediately with empty proof, generate proof in background
pvp.respondShotResult(row, col, result, [], sunkShipName, sunkShipSize);
generateShotProof(...); // fire-and-forget
```

To:
```ts
// New: generate proof first, then send with real proof
const commitment = state.commitment?.playerZk;
if (commitment) {
  try {
    const proofResult = await shotProof({
      ships: toShipTuples(state.playerShips),
      nonce: String(commitment.nonce),
      boardHash: commitment.boardHash,
      row: atk.row,
      col: atk.col,
      isHit: result === 'hit',
    });
    pvp.respondShotResult(atk.row, atk.col, result, Array.from(proofResult.proof), sunkShipName, sunkShipSize);
  } catch (err) {
    console.error('shot_proof generation failed:', err);
    // If proof generation fails, send empty — server will reject and opponent wins
    pvp.respondShotResult(atk.row, atk.col, result, [], sunkShipName, sunkShipSize);
  }
} else {
  pvp.respondShotResult(atk.row, atk.col, result, [], sunkShipName, sunkShipSize);
}
```

**Step 2: Add battle:reveal emission after game_over**

In the PvP game_over handler in Battle.tsx, after the game ends, send the reveal:
```ts
// After receiving battle:game_over
const commitment = state.commitment?.playerZk;
if (commitment && pvp.matchId) {
  pvp.sendReveal(pvp.matchId, toShipTuples(state.playerShips), String(commitment.nonce));
}
```

**Step 3: Add sendReveal to pvp/interactor.ts**

Add new function:
```ts
export function sendReveal(matchId: string, ships: ShipTuple[], nonce: string): void {
  const socket = getSocket();
  if (!socket || !signerKeys) return;

  const data = { matchId, ships, nonce };
  const { timestamp, signature } = signAction(signerKeys, 'battle:reveal', data);

  socket.emit('battle:reveal', { matchId, ships, nonce, timestamp, signature });
}
```

**Step 4: Add battle:finalized listener to pvp/interactor.ts**

In `initPvP`, add:
```ts
socket.on('battle:finalized', (data: { turnsProofHash: string; txHash: string }) => {
  console.log('[pvp] Match finalized:', data);
  callbacks.onFinalized?.(data);
});
```

**Step 5: Verify compiles**

Run: `cd web && npx tsc --noEmit`

**Step 6: Commit**

```bash
git add web/src/pages/Battle.tsx web/src/pvp/interactor.ts
git commit -m "feat: send real shot_proof in PvP + battle:reveal at game end"
```

---

## Task 10: Web Arcade — Store Proofs in Match History

**Files:**
- Modify: `web/src/game/translator.tsx`
- Modify: `web/src/pages/Battle.tsx`

**Step 1: Ensure Arcade shot proofs are stored in state**

In Battle.tsx, in the Arcade shot proof generation, store the proof in a ref or state array that gets saved to match history on game end. The current `zkLogs` state already tracks this — ensure it persists to `MatchRecord.commitment.shotProofs`.

**Step 2: Ensure turns_proof is saved to match history**

In `game/translator.tsx`, the `endGame` function already generates `turnsProof` in background. Ensure the result is saved to the match record:
```ts
turnsProof(turnsInput).then(result => {
  // Save to match record
  const records = JSON.parse(localStorage.getItem('@battleship_history') || '[]');
  const latest = records[records.length - 1];
  if (latest) {
    latest.turnsProof = Array.from(result.proof);
    localStorage.setItem('@battleship_history', JSON.stringify(records));
  }
});
```

**Step 3: Verify compiles**

Run: `cd web && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add web/src/game/translator.tsx web/src/pages/Battle.tsx
git commit -m "feat: store ZK proofs in Arcade match history"
```

---

## Task 11: Web Payment — Update Client for Memo-Based Flow

**Files:**
- Modify: `web/src/pages/PvpMode.tsx`
- Modify: `web/src/wallet/interactor.ts`

**Step 1: Update payment flow in PvpMode.tsx**

Replace the current payment logic with:
1. `POST /api/payment/memo { playerPk }` → get memo
2. Build atomic tx: `changeTrust(BATTLE)` + `payment(XLM, serverAddr, memo)`
3. Submit tx
4. Poll `GET /api/payment/status/{playerPk}` until `hasToken: true` (or listen via socket)
5. Proceed to matchmaking

**Step 2: Update sendPayment in wallet/interactor.ts**

Modify to accept `memo` parameter and add `changeTrust` operation:
```ts
export async function sendPaymentWithTrustline(
  secret: string,
  destination: string,
  amount: string,
  memo: string,
  assetCode: string,
): Promise<string> {
  const StellarSdk = await import('@stellar/stellar-sdk');
  const { Keypair, TransactionBuilder, Networks, Operation, Asset, Memo, BASE_FEE } = StellarSdk;
  const horizon = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

  const kp = Keypair.fromSecret(secret);
  const account = await horizon.loadAccount(kp.publicKey());
  const battleAsset = new Asset(assetCode, destination);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset: battleAsset }))
    .addOperation(Operation.payment({
      destination,
      asset: Asset.native(),
      amount,
    }))
    .addMemo(Memo.text(memo))
    .setTimeout(30)
    .build();

  tx.sign(kp);
  const result = await horizon.submitTransaction(tx);
  return result.hash;
}
```

**Step 3: Verify compiles**

Run: `cd web && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add web/src/pages/PvpMode.tsx web/src/wallet/interactor.ts
git commit -m "feat: memo-based payment flow + changeTrust in atomic tx"
```

---

## Task 12: Final Cleanup + Verify Full Pipeline

**Step 1: Remove unused imports across all modified files**

Scan for any remaining references to deleted files/functions:
- `hasValidPayment`, `consumePayment`, `verifiedPayments`
- `ServerZKProvider`, `VITE_ZK_MODE`, `VITE_ZK_SERVER_URL`
- `InMemoryGameRepository`, `IGameRepository`
- Proof generation route references

**Step 2: Verify both projects compile**

```bash
cd backend && npx tsc --noEmit
cd ../web && npx tsc --noEmit
```

**Step 3: Run existing tests**

```bash
cd backend && npm test
cd ../web && npm test
```

**Step 4: Final commit**

```bash
git add -A && git commit -m "chore: final cleanup — remove unused imports and dead code"
```
