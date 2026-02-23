# Plano de Migração: Arquitetura Híbrida (Railway + Supabase)

## Contexto

O backend atual (`backend/`) é um servidor Express + Socket.io com estado in-memory para PvP real-time e endpoints REST para ZK proofs. Não persiste dados — matches são perdidos ao reiniciar.

**POC realizado em 23/02/2026:** bb.js (ZK proof verification) **NÃO funciona** em Supabase Edge Functions. O runtime Deno não suporta Web Workers, que bb.js requer para executar WASM. Testadas 4 abordagens (noir_js@beta.2, beta.18, bb.js@0.82.2, bb.js@3.0.0-nightly, backend type 'wasm') — todas falharam com `Not implemented: Worker.prototype.constructor`.

**Decisão: Arquitetura híbrida**
- **Railway**: Deploy do backend Express monolito (Socket.io + ZK proofs + game logic) — tudo como está
- **Supabase**: Apenas Postgres como banco de dados para persistência (match history, stats, rankings, player profiles)
- O backend conecta no Supabase Postgres via `@supabase/supabase-js` (já instalado no projeto)

---

## Arquitetura

```
Mobile App
  ├── Socket.io ──→ Backend Express (Railway)
  │                    ├── Matchmaking (in-memory queue)
  │                    ├── Battle (real-time PvP)
  │                    ├── ZK Prove (Noir/bb.js WASM)
  │                    ├── ZK Verify (Noir/bb.js WASM)
  │                    ├── Ed25519 Auth
  │                    └── @supabase/supabase-js ──→ Supabase Postgres
  │
  └── (futuro) @supabase/supabase-js ──→ Supabase Postgres (leitura direta de stats/history)

Supabase Postgres
  ├── players (public_key, display_name, rank, xp, created_at)
  ├── matches (id, status, grid_size, player1_key, player2_key, winner, reason, turn_count, duration_ms, created_at)
  ├── match_attacks (id, match_id FK, attacker_key, row, col, result, turn_number, created_at)
  └── player_stats (player_key, wins, losses, total_matches, avg_turns, rank, xp)
```

### Por que Railway?

- Suporta WebSockets nativamente (Socket.io funciona)
- Processos long-running (sem cold start, sem timeout de 60s)
- WASM pesado (bb.js) sem restrições de Workers
- Deploy via Git push (GitHub integration)
- Free tier: $5 crédito/mês (suficiente para dev/teste)
- Dockerfile ou Nixpacks (auto-detect Node.js)

### Por que Supabase só como DB?

- Edge Functions não suportam bb.js (Workers)
- Socket.io é mais maduro que Supabase Realtime Broadcast para game logic server-authoritative
- Manter o monolito evita reescrever toda a lógica de jogo
- Postgres do Supabase é grátis (500MB, suficiente), com dashboard, backups, e migrations

---

## Etapas de Implementação

### E1 — Schema do Banco (Supabase Postgres)
**Via:** Supabase MCP ou migrations SQL

Criar tabelas para persistência de dados que hoje são in-memory e se perdem:

```sql
-- Players: perfis persistentes
CREATE TABLE players (
  public_key TEXT PRIMARY KEY,
  display_name TEXT,
  rank TEXT DEFAULT 'Recruit',
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matches: histórico de partidas
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, placing, battle, finished
  grid_size INTEGER NOT NULL DEFAULT 10,
  match_code TEXT, -- friend match code
  player1_key TEXT REFERENCES players(public_key),
  player2_key TEXT REFERENCES players(public_key),
  winner_key TEXT,
  finish_reason TEXT, -- all_ships_sunk, timeout, forfeit, disconnect
  turn_count INTEGER DEFAULT 0,
  duration_ms INTEGER,
  ship_sizes INTEGER[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- Attacks: log de todos os ataques (replay, analytics)
CREATE TABLE match_attacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  attacker_key TEXT NOT NULL,
  row INTEGER NOT NULL,
  col INTEGER NOT NULL,
  result TEXT, -- hit, miss
  turn_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Player stats: agregado para ranking global
CREATE TABLE player_stats (
  player_key TEXT PRIMARY KEY REFERENCES players(public_key),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  avg_turns REAL DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_player1 ON matches(player1_key);
CREATE INDEX idx_matches_player2 ON matches(player2_key);
CREATE INDEX idx_match_attacks_match ON match_attacks(match_id);
CREATE INDEX idx_player_stats_wins ON player_stats(wins DESC);
```

- RLS: desabilitado (backend acessa via service_role key, não via client direto)
- O mobile pode ler stats/history via anon key com RLS SELECT habilitado no futuro

### E2 — Integrar Supabase Client no Backend
**Arquivos:** `backend/src/shared/supabase.ts` (novo)

- Criar cliente Supabase com service_role key
- Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Helper functions:
  - `saveMatch(match)` — insere match finalizado
  - `saveAttacks(matchId, attacks[])` — bulk insert de ataques
  - `upsertPlayer(publicKey)` — cria player se não existe
  - `updatePlayerStats(publicKey, win: boolean, turns: number)` — atualiza stats
  - `getPlayerStats(publicKey)` — busca stats
  - `getMatchHistory(publicKey, limit)` — busca histórico
  - `getLeaderboard(limit)` — ranking global

### E3 — Persistir Matches no Game Over
**Arquivos:** `backend/src/battle/interactor.ts`, `backend/src/ws/socket.ts`

Quando um match termina (all_ships_sunk, timeout, forfeit, disconnect):
1. Chamar `saveMatch()` com dados do MatchRoom
2. Chamar `saveAttacks()` com o array de attacks
3. Chamar `updatePlayerStats()` para ambos os players
4. Emit `battle:game_over` com stats atualizados

Hoje os dados morrem quando o match acaba. Com isso, temos histórico completo.

### E4 — Endpoints REST de Stats/History
**Arquivos:** `backend/src/stats/translator.ts` (novo), `backend/src/app.ts`

Novos endpoints REST no Express (não precisam de Socket.io):
- `GET /api/player/:publicKey/stats` → player_stats
- `GET /api/player/:publicKey/history?limit=20` → matches do player
- `GET /api/leaderboard?limit=50` → ranking global
- `GET /api/match/:matchId` → detalhes + ataques de um match

Esses endpoints podem ser chamados pelo mobile diretamente.

### E5 — Deploy Backend no Railway
**Arquivos:** `Dockerfile` ou `railway.toml` (novo na raiz do backend)

1. Criar conta Railway + projeto
2. Conectar repo GitHub
3. Configurar env vars:
   - `PORT=3001`
   - `CIRCUIT_DIR=./circuits/compiled`
   - `SUPABASE_URL=https://jebbzmthelfpuutjjvsj.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY=<secret>`
4. Configurar build: `npm run build` → start: `npm start`
5. Os circuits compilados (1.8MB total) ficam no repo e são deployados junto
6. Railway expõe URL pública com WebSocket support

```toml
# railway.toml (opcional, Railway auto-detecta Node.js)
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/health"
restartPolicyType = "on_failure"
```

### E6 — Atualizar Mobile para usar Railway URL
**Arquivos:** `mobile/.env`

```env
EXPO_PUBLIC_ZK_MODE=remote
EXPO_PUBLIC_ZK_SERVER_URL=https://<app-name>.up.railway.app
```

### E7 — Fix Versão Noir (bonus)
**Arquivos:** `backend/package.json`

O POC revelou que `noir_js@1.0.0-beta.18` não é compatível com circuits compilados por `nargo 1.0.0-beta.2`. Alinhar:
- `@noir-lang/noir_js` → `1.0.0-beta.2`
- Ou recompilar circuits com nargo 1.0.0-beta.18

### E8 — Testes e Validação
- Testar backend local conectando no Supabase Postgres remoto
- Testar deploy no Railway (WebSocket + ZK proofs)
- Verificar persistência: jogar match → checar dados no Supabase dashboard
- Testar endpoints de stats/history
- Testar reconexão Socket.io no Railway

---

## Arquivos Críticos

| Arquivo | Ação |
|---|---|
| `backend/src/shared/supabase.ts` | **Novo** — cliente Supabase + helpers de persistência |
| `backend/src/battle/interactor.ts` | **Editar** — chamar saveMatch/saveAttacks no game over |
| `backend/src/ws/socket.ts` | **Editar** — upsertPlayer no connect, persistir no disconnect |
| `backend/src/stats/translator.ts` | **Novo** — endpoints REST de stats/history |
| `backend/src/app.ts` | **Editar** — registrar rotas de stats |
| `backend/package.json` | **Editar** — fix versão noir_js |
| `backend/.env` | **Editar** — adicionar SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY |
| `mobile/.env` | **Editar** — apontar para Railway URL |

## Projeto Supabase

- **ID:** `jebbzmthelfpuutjjvsj`
- **URL:** `https://jebbzmthelfpuutjjvsj.supabase.co`
- **Região:** sa-east-1 (São Paulo)
- **Org:** hackathons-mvp
- **Storage:** bucket `circuits` com hash_helper.json e board_validity.json (do POC, pode ser removido)

## Riscos

1. **Railway free tier** ($5/mês) pode não ser suficiente se houver muitos matches simultâneos. Mitigação: monitorar uso, upgrade quando necessário.
2. **Latência Railway ↔ Supabase**: Backend no Railway (região variável) e Postgres no Supabase (sa-east-1). Mitigação: escolher região Railway próxima (us-east ou sa).
3. **Versão Noir mismatch**: Circuits compilados com beta.2, backend usa beta.18. Precisa alinhar antes de tudo.

## Verificação

1. `npm run dev` no backend com `.env` apontando para Supabase → jogo funciona local
2. Deploy no Railway → WebSocket conecta, ZK proofs funcionam
3. Jogar match completo → dados persistidos no Supabase dashboard
4. `GET /api/leaderboard` retorna ranking
5. Mobile conecta no Railway URL → PvP funciona end-to-end
