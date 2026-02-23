# PvP Online - Plano de Implementacao

## Contexto

O jogo Stealth Battleship e atualmente single-player vs AI. O botao "PvP ONLINE" ja existe no menu (desabilitado). A arquitetura atual usa engine de funcoes puras (`processAttack`, `checkWinCondition`) o que facilita reuso em PvP. Nao existe nenhum backend, banco de dados, ou codigo de rede. Toda persistencia e local via AsyncStorage.

O objetivo e adicionar modo PvP online mantendo o jogo leve e preparando o caminho para ZK proofs no futuro.

---

## Backend: Supabase

**Por que Supabase:**
- Realtime Channels (Broadcast + Presence) = perfeito pra jogo por turnos
- Postgres com Row Level Security = oponente nao ve posicoes dos navios
- Edge Functions (TypeScript) = pode rodar `processAttack()` server-side
- Auth anonimo built-in = sem fricao pro jogador
- SDK funciona direto no React Native/Expo (`@supabase/supabase-js`)
- Free tier generoso (50k MAU, 500MB DB)
- Path claro pra ZK: Edge Function vira verificador de provas

**Instalar:** `npx expo install @supabase/supabase-js expo-crypto`

---

## Protocolo do Jogo

### Fluxo completo

```
MATCHMAKING → PLACEMENT → BATTLE → GAME_OVER
  (lobby)    (ambos colocam)  (turnos)  (verificacao)
```

### 1. Matchmaking (fila simples)
- Player toca "PvP ONLINE" → chama Edge Function `find-match(player_id, grid_size)`
- Se existe match esperando com mesmo grid_size → entra como player_2
- Se nao → cria match novo e espera
- Ambos assinam Realtime Channel `match:{id}`
- Tela: RadarSpinner + "Searching for opponent..." + botao cancelar

### 2. Placement (paralelo e independente)
- Ambos colocam navios normalmente (reusa componentes atuais)
- Ao tocar "READY":
  - Gera nonce aleatorio (32 bytes)
  - Computa hash: `SHA-256(board_json + nonce)`
  - Envia APENAS o hash ao servidor (navios ficam so no client)
  - Servidor grava hash e marca player como ready
  - Broadcast `player_ready` pro oponente
- Quando ambos ready → servidor broadcast `battle_start` com `first_turn` aleatorio

### 3. Battle (commit-reveal por turno)

```
Atacante toca celula
→ Edge Function submit-attack(match_id, player_id, position)
→ Servidor valida (turno correto, posicao valida, nao repetida)
→ Broadcast 'attack_incoming' pro defensor

Defensor recebe ataque
→ Processa localmente com processAttack()
→ Edge Function submit-result(match_id, position, result, ship_id?)
→ Servidor grava resultado, troca turno
→ Broadcast 'attack_result' pra ambos

Ambos atualizam estado local via dispatch
```

### 4. Fim de jogo
- Quando todos navios de um jogador afundam → `game_over`
- Perdedor revela board_json + nonce
- Servidor verifica: `SHA-256(board_json + nonce) == hash_commitado`
- Servidor replaya todos ataques contra o board revelado
- Se qualquer resultado nao bate → trapaceiro identificado

### 5. Desconexao
- Presence tracking via Supabase Realtime
- Timeouts: 60s no placement, 60s por turno, 30s pra reconectar
- Auto-forfeit se timeout expira
- Reconexao: re-subscribe no channel + `get_match_state()` pra sync

---

## Modelo de Dados (Supabase/Postgres)

```sql
-- Jogadores (auth anonimo)
players: id, display_name, device_id, pvp_wins, pvp_losses, rating(Elo)

-- Partidas
matches: id, grid_size, status, player_1_id, player_2_id,
         player_1_ready, player_2_ready,
         player_1_board_hash, player_2_board_hash,
         current_turn, turn_number, winner_id, finish_reason

-- Log de ataques (append-only)
attacks: id, match_id, turn_number, attacker_id,
         position_row, position_col, result, ship_id

-- Revelacao de board (pos-jogo)
board_reveals: id, match_id, player_id, board_json, nonce, verified
```

---

## Seguranca / Anti-Cheat

| Ameaca | Mitigacao |
|--------|-----------|
| Ver navios do oponente | Navios nunca vao pro servidor, so hash |
| Mentir sobre hit/miss | Verificacao pos-jogo via board reveal |
| Jogar fora do turno | Servidor valida current_turn |
| Atacar mesma celula | Servidor checa tabela attacks |
| Manipular timer | Timestamps server-side |
| **Futuro ZK** | Cada resultado inclui ZK proof ao inves de confianca |

---

## Mudancas no Frontend

### Arquivos novos

**Telas (app/):**
| Arquivo | Funcao |
|---------|--------|
| `pvp-lobby.tsx` | Matchmaking com RadarSpinner |
| `pvp-placement.tsx` | Placement com hash commitment |
| `pvp-battle.tsx` | Batalha PvP com turnos via rede |
| `pvp-gameover.tsx` | Resultado + board reveal |

**Servicos (src/services/):**
| Arquivo | Funcao |
|---------|--------|
| `supabase.ts` | Cliente Supabase + auth |
| `matchmaking.ts` | find/create/cancel match |
| `pvpChannel.ts` | Realtime channel management |
| `boardCommitment.ts` | SHA-256 hash + nonce |

**Context/Hooks (src/):**
| Arquivo | Funcao |
|---------|--------|
| `context/PvPContext.tsx` | Estado de rede (matchId, opponent, connection) |
| `hooks/usePvPMatch.ts` | Orquestra ciclo de turno PvP |
| `hooks/useConnectionStatus.ts` | Presenca do oponente |

**Componentes (src/components/PvP/):**
| Arquivo | Funcao |
|---------|--------|
| `OpponentStatus.tsx` | Nome + status conexao |
| `TurnTimer.tsx` | Countdown por turno |
| `ConnectionBanner.tsx` | "Oponente desconectou..." |

**Backend (supabase/):**
| Arquivo | Funcao |
|---------|--------|
| `migrations/001_create_tables.sql` | Schema |
| `functions/find-match/` | Matchmaking |
| `functions/submit-placement/` | Hash commitment |
| `functions/submit-attack/` | Validacao ataque |
| `functions/submit-result/` | Resultado + troca turno |
| `functions/submit-forfeit/` | Desistencia |
| `functions/verify-board/` | Verificacao pos-jogo |

### Arquivos existentes a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/types/game.ts` | Adicionar `GameMode`, tipos PvP |
| `src/context/GameContext.tsx` | Action `OPPONENT_ATTACK`, field `gameMode` |
| `app/menu.tsx` | Habilitar botao PvP → navegar pra lobby |
| `app/battle.tsx` | Extrair `BattleView` compartilhado (AI e PvP reusam) |
| `src/storage/scores.ts` | Campo `matchType` e `opponentName` no MatchRecord |
| `src/engine/stats.ts` | Renomear `aiShots` → `opponentShots` (ou alias) |

### Componentes reutilizados SEM mudanca
GameBoard, Cell, FleetStatus, SunkShipModal, ShipSelector, NavalButton, RadarSpinner, GradientContainer, CoordinateLabels

---

## Fases de Implementacao

### Fase 1: Infra Supabase (~2-3 dias)
- Criar projeto Supabase
- Rodar migrations (tabelas + RLS)
- Instalar SDK no frontend
- Auth anonimo funcionando
- Config de env (SUPABASE_URL, SUPABASE_ANON_KEY)

### Fase 2: Matchmaking (~2-3 dias)
- Edge Function `find-match`
- Tela `pvp-lobby.tsx`
- Habilitar botao no menu
- Realtime Channel subscription
- Teste: dois devices se encontram

### Fase 3: Placement PvP (~2-3 dias)
- Board commitment (expo-crypto SHA-256)
- Edge Function `submit-placement`
- Tela `pvp-placement.tsx`
- Presence tracking
- Teste: ambos colocam navios e dao ready

### Fase 4: Battle PvP (~4-5 dias)
- `PvPContext` + `usePvPMatch` hook
- Edge Functions: `submit-attack`, `submit-result`
- Tela `pvp-battle.tsx`
- Componentes: OpponentStatus, TurnTimer
- Ciclo completo ataque-resultado-turno
- Teste: partida PvP completa do inicio ao fim

### Fase 5: Game End + Verificacao (~2-3 dias)
- Edge Function `verify-board`
- Tela `pvp-gameover.tsx`
- Board reveal + verificacao hash
- Stats/XP pra PvP
- Match history com nome do oponente

### Fase 6: Robustez (~3-4 dias)
- Desconexao/reconexao
- ConnectionBanner
- Turn timer com auto-forfeit
- Edge Function `submit-forfeit`
- Cenarios de edge case

### Fase 7: Polish (~2-3 dias)
- Haptics PvP
- Animacoes de transicao de turno
- Indicador de qualidade de conexao
- Error handling completo

---

## Path para ZK Proofs (futuro)

A unica mudanca necessaria no protocolo:

```
ANTES (commit-reveal):
  submit_result(match_id, position, result)

DEPOIS (ZK):
  submit_result(match_id, position, result, zk_proof)
```

O Edge Function passa a verificar a prova ZK ao inves de confiar no client.
Board reveal pos-jogo se torna desnecessario. Schema do banco nao muda.

---

## Decisoes tomadas
- **Backend:** Supabase (Realtime + Postgres + Edge Functions)
- **Auth:** Anonimo (zero fricao, sessao persistente via device_id)
- **Anti-cheat:** Commit-reveal (hash SHA-256 do board), upgrade path pra ZK proofs
- **Arquitetura:** PvPContext separado wrapping GameContext (nao mistura rede com game state)
