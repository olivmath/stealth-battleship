# Supabase Migration Guide

> Migrate the Battleship ZK backend from Express + Socket.io to Supabase Edge Functions + Realtime.

## 1. Overview

### Current Architecture

The backend (`backend/src/server.ts`) runs a single Node.js process that:

- **Express HTTP server** — serves REST endpoints for ZK proof generation and verification
- **Socket.io WebSocket server** — handles real-time PvP matchmaking, battle events, and reconnection
- **In-memory state** — `Map` objects store matches, player connections, match queue, and rate limits
- **Ed25519 auth** — custom signature verification via `tweetnacl` on every WebSocket event
- **Circuit loading** — compiled Noir circuits (`.json`) loaded at startup into memory

### Target Architecture

- **Supabase Edge Functions (Deno)** — replace Express REST endpoints
- **Supabase Realtime Channels (Broadcast)** — replace Socket.io for PvP events
- **Supabase Auth** — replace custom Ed25519 handshake with JWT-based auth
- **PostgreSQL (Supabase)** — replace in-memory Maps with persistent tables
- **Supabase Vault** — replace `.env` file for secrets management

---

## 2. Component Mapping

| Current (Express + Socket.io) | Target (Supabase) |
|---|---|
| `app.ts` Express REST routes | Supabase Edge Functions (Deno) |
| `ws/socket.ts` Socket.io server | Supabase Realtime Channels (Broadcast) |
| `auth/verifier.ts` Ed25519 (tweetnacl) | Supabase Auth (custom JWT provider) |
| `matchmaking/entities.ts` in-memory Maps | PostgreSQL tables (`matches`, `attacks`, `match_queue`) |
| `shared/circuits.ts` circuit loading | Bundled WASM in Edge Function or external storage |
| `backend/.env` (PORT, CIRCUIT_DIR) | Supabase Vault secrets |

### Detailed Mappings

#### Express REST -> Supabase Edge Functions

Each Express route from `app.ts` becomes a standalone Edge Function:

| Express Route | Edge Function |
|---|---|
| `GET /health` | `supabase/functions/health/index.ts` |
| `POST /api/prove/board-validity` | `supabase/functions/prove-board-validity/index.ts` |
| `POST /api/prove/shot-proof` | `supabase/functions/prove-shot-proof/index.ts` |
| `POST /api/prove/turns-proof` | `supabase/functions/prove-turns-proof/index.ts` |
| `POST /api/verify/board-validity` | `supabase/functions/verify-board-validity/index.ts` |
| `POST /api/verify/shot-proof` | `supabase/functions/verify-shot-proof/index.ts` |
| `POST /api/verify/turns-proof` | `supabase/functions/verify-turns-proof/index.ts` |

#### Socket.io -> Supabase Realtime Channels

| Socket.io Event | Realtime Channel | Broadcast Event |
|---|---|---|
| `match:find_random` | `matchmaking` | `find_random` |
| `match:cancel_search` | `matchmaking` | `cancel_search` |
| `match:create_friend` | `matchmaking` | `create_friend` |
| `match:join_friend` | `matchmaking` | `join_friend` |
| `placement:ready` | `match:{matchId}` | `placement_ready` |
| `battle:attack` | `match:{matchId}` | `attack` |
| `battle:shot_result` | `match:{matchId}` | `shot_result` |
| `battle:forfeit` | `match:{matchId}` | `forfeit` |
| `battle:turn_start` | `match:{matchId}` | `turn_start` |
| `battle:game_over` | `match:{matchId}` | `game_over` |

#### Ed25519 Auth -> Supabase Auth

Currently, `auth/verifier.ts` verifies Ed25519 signatures on every connection and action using `tweetnacl`:

```typescript
// Current: custom Ed25519 signature verification
const message = new TextEncoder().encode(`${publicKey}:${timestamp}:${nonce}`);
nacl.sign.detached.verify(message, sigBytes, pkBytes);
```

Migration path:
1. Register each Ed25519 public key as a Supabase user (custom JWT provider)
2. Generate JWTs server-side upon initial Ed25519 challenge verification
3. Supabase RLS policies enforce auth via `auth.uid()` instead of manual signature checks
4. Action-level signatures (`verifyAction`) can optionally be kept for ZK audit trail

#### In-memory Maps -> PostgreSQL Tables

| In-memory Structure | PostgreSQL Table |
|---|---|
| `matches: Map<string, MatchRoom>` | `matches` table |
| `playerToMatch: Map<string, string>` | `match_players` table (or FK on matches) |
| `matchQueue: QueueEntry[]` | `match_queue` table |
| `matchCodeIndex: Map<string, string>` | `match_code` column on `matches` table |
| `connectedPlayers: Map<string, string>` | Realtime Presence tracking |
| `disconnectGrace: Map<string, Timeout>` | `pg_cron` scheduled job or Realtime Presence |
| `lastAttackTime: Map<string, number>` | Rate limiting via Edge Function middleware |

---

## 3. Edge Functions Migration

### Proof Endpoint Pattern

Each proof endpoint follows the same IATE pattern already used in the Express backend. Example for `prove-board-validity`:

```typescript
// supabase/functions/prove-board-validity/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  // Auth: verify JWT from Authorization header
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return new Response("Unauthorized", { status: 401 });

  // Validate input (entity layer)
  const body = await req.json();
  const validation = validateBoardValidityInput(body);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
  }

  // Execute use case (interactor)
  const result = await proveBoardValidity(validation.data, adapter);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### Payment Verification Edge Function

Payment verification (Stellar) becomes a dedicated Edge Function:

```
supabase/functions/verify-payment/index.ts
```

This function:
1. Receives a Stellar transaction hash
2. Queries Horizon API to confirm payment
3. Updates the `payments` table via Supabase client
4. Returns confirmation to the caller

### Circuit Loading Strategy

The current backend loads 4 circuits at startup from the filesystem (`shared/circuits.ts`):

```typescript
// Current: loads from CIRCUIT_DIR at startup
const names = ['hash_helper', 'board_validity', 'shot_proof', 'turns_proof'];
```

**Option A: Bundled WASM (recommended for V1)**
- Bundle compiled circuit JSON files directly in the Edge Function deployment
- Each proof function bundles only its required circuit
- Tradeoff: larger function size, but zero cold-start latency for circuit loading

**Option B: External Storage (Supabase Storage)**
- Upload circuit files to Supabase Storage bucket
- Download on first invocation, cache in function memory
- Tradeoff: smaller deployment, but cold-start penalty on first request

**Recommendation:** Start with Option A (bundled). Circuit JSON files are ~1-3MB each, within Edge Function size limits. Move to Option B only if deployment size becomes an issue.

---

## 4. Realtime Migration

### Match Rooms -> Realtime Channels

Currently, `ws/socket.ts` manages match rooms by storing socket IDs and emitting targeted events:

```typescript
// Current: targeted Socket.io emissions
io.to(match.player1.socketId).emit('battle:turn_start', { ... });
io.to(match.player2.socketId).emit('battle:turn_start', { ... });
```

With Supabase Realtime, each match gets a dedicated channel:

```typescript
// Target: Supabase Realtime Broadcast
const channel = supabase.channel(`match:${matchId}`);

// Player subscribes to their match channel
channel.on("broadcast", { event: "turn_start" }, (payload) => {
  // Handle turn start
});

// Server-side (Edge Function) broadcasts to channel
channel.send({
  type: "broadcast",
  event: "turn_start",
  payload: { currentTurn, turnNumber, deadline },
});
```

### Turn Events -> Broadcast Messages

The battle flow maps directly to Broadcast events:

1. **placement:ready** -> Player calls Edge Function `submit-placement`, which broadcasts `placement_ready` to the match channel
2. **battle:attack** -> Player calls Edge Function `submit-attack`, which broadcasts `incoming_attack` to the match channel
3. **battle:shot_result** -> Defender calls Edge Function `submit-shot-result`, which broadcasts `result_confirmed` to the match channel
4. **battle:turn_start** -> Edge Function broadcasts `turn_start` after processing shot result
5. **battle:game_over** -> Edge Function broadcasts `game_over` when win condition met

### Turn Timers

Currently managed with `setTimeout` in `battle/interactor.ts`:

```typescript
// Current: in-process timers
match.turnTimer = setTimeout(() => { ... }, TURN_TIMEOUT_MS);
```

Migration options:
- **pg_cron**: Schedule timeout checks every 5 seconds, query matches with expired deadlines
- **Edge Function cron**: Supabase scheduled Edge Function runs periodically to check timeouts
- **Client-side enforcement**: Both clients enforce the 30-second turn timer; server validates timestamp on next action

**Recommendation:** Use a scheduled Edge Function (runs every 10 seconds) that queries `matches` table for expired turns and broadcasts `game_over` events.

### Grace Period -> Presence Tracking

Currently, `ws/socket.ts` uses a 60-second `disconnectGrace` Map:

```typescript
// Current: in-memory grace period
disconnectGrace.set(publicKey, setTimeout(() => {
  // Auto-forfeit after 60 seconds
}, GRACE_PERIOD_MS));
```

With Supabase Realtime Presence:

```typescript
// Target: Presence tracking
const channel = supabase.channel(`match:${matchId}`);
channel.track({ user_id: publicKey, online_at: new Date().toISOString() });

// Detect disconnection via presence sync
channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
  // Record disconnect timestamp in DB
  // Scheduled Edge Function checks for 60-second grace period expiry
});
```

---

## 5. RLS Policies

### `matches` Table

Players can only read matches they participate in:

```sql
-- SELECT: players see only their own matches
CREATE POLICY "Players can view own matches"
  ON matches FOR SELECT
  USING (
    auth.uid()::text = player1_public_key
    OR auth.uid()::text = player2_public_key
  );

-- INSERT: authenticated users can create matches
CREATE POLICY "Authenticated users can create matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid()::text = player1_public_key);

-- UPDATE: only match participants can update (via Edge Functions with service role)
CREATE POLICY "Service role updates matches"
  ON matches FOR UPDATE
  USING (auth.role() = 'service_role');
```

### `attacks` Table

Read-only for match participants:

```sql
-- SELECT: match participants can view attacks
CREATE POLICY "Match participants can view attacks"
  ON attacks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = attacks.match_id
      AND (
        auth.uid()::text = matches.player1_public_key
        OR auth.uid()::text = matches.player2_public_key
      )
    )
  );

-- INSERT: only service role (Edge Functions) can insert attacks
CREATE POLICY "Service role inserts attacks"
  ON attacks FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

### `payments` Table

Players can only see their own payments:

```sql
-- SELECT: players see only their own payments
CREATE POLICY "Players can view own payments"
  ON payments FOR SELECT
  USING (auth.uid()::text = player_public_key);

-- INSERT: only service role
CREATE POLICY "Service role inserts payments"
  ON payments FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

### `player_stats` Table

Public read, authenticated write:

```sql
-- SELECT: anyone can read stats (leaderboard)
CREATE POLICY "Public read for player stats"
  ON player_stats FOR SELECT
  USING (true);

-- INSERT: service role only
CREATE POLICY "Service role manages player stats"
  ON player_stats FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- UPDATE: service role only
CREATE POLICY "Service role updates player stats"
  ON player_stats FOR UPDATE
  USING (auth.role() = 'service_role');
```

---

## 6. Environment Variables

### Current Environment Variables

From `backend/.env`:

| Variable | Value | Purpose |
|---|---|---|
| `PORT` | `3001` | HTTP server port |
| `CIRCUIT_DIR` | `../circuits/compiled` | Path to compiled Noir circuits |

### Supabase Vault Mapping

| Current Env Var | Supabase Vault Secret | Notes |
|---|---|---|
| `PORT` | N/A | Managed by Supabase infrastructure |
| `CIRCUIT_DIR` | N/A | Circuits bundled in Edge Functions |
| (new) `STELLAR_HORIZON_URL` | `stellar_horizon_url` | Stellar network endpoint |
| (new) `STELLAR_NETWORK_PASSPHRASE` | `stellar_network_passphrase` | Network identification |
| (new) `SOROBAN_CONTRACT_ID` | `soroban_contract_id` | UltraHonk verifier contract |
| (new) `SOROBAN_RPC_URL` | `soroban_rpc_url` | Soroban RPC endpoint |

Auto-provided by Supabase (no configuration needed):
- `SUPABASE_URL` — project URL
- `SUPABASE_ANON_KEY` — public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (used by Edge Functions)
- `SUPABASE_DB_URL` — direct database connection string

---

## 7. Step-by-step Checklist

- [ ] **Create Supabase project** — set up project in Supabase dashboard, note URL and keys
- [ ] **Run migrations** — apply PostgreSQL schema (`matches`, `attacks`, `payments`, `player_stats`, `match_queue` tables)
- [ ] **Set up Supabase Auth** — configure custom JWT provider for Ed25519 public key authentication
- [ ] **Deploy Edge Functions** — create and deploy each proof/verify endpoint as a separate Deno function
  - [ ] `prove-board-validity`
  - [ ] `prove-shot-proof`
  - [ ] `prove-turns-proof`
  - [ ] `verify-board-validity`
  - [ ] `verify-shot-proof`
  - [ ] `verify-turns-proof`
  - [ ] `verify-payment`
  - [ ] `submit-placement`
  - [ ] `submit-attack`
  - [ ] `submit-shot-result`
  - [ ] `health`
- [ ] **Bundle circuits** — include compiled circuit JSON in each proof Edge Function
- [ ] **Configure Realtime channels** — enable Realtime on project, set up `matchmaking` and `match:{id}` channel patterns
- [ ] **Set up RLS policies** — apply all policies from Section 5 to each table
- [ ] **Configure Vault secrets** — add Stellar/Soroban credentials to Supabase Vault
- [ ] **Deploy timeout cron** — scheduled Edge Function for turn timeout and grace period enforcement
- [ ] **Update frontend WebSocket URL** — replace Socket.io client with Supabase Realtime client in mobile app
  - [ ] Update `src/zk/adapter.tsx` to use `@supabase/supabase-js` instead of `socket.io-client`
  - [ ] Replace Socket.io event handlers with Realtime channel subscriptions
  - [ ] Update matchmaking flow to use Edge Function calls + channel subscriptions
- [ ] **Test end-to-end** — verify all flows:
  - [ ] Auth (Ed25519 key -> Supabase JWT)
  - [ ] Matchmaking (random + friend code)
  - [ ] Placement (board hash + proof submission)
  - [ ] Battle (attack -> shot result -> turn advance)
  - [ ] Win condition + game over
  - [ ] Disconnect grace period + reconnection
  - [ ] Proof generation and verification
- [ ] **DNS + custom domain** — configure custom domain for Supabase project and Edge Functions
