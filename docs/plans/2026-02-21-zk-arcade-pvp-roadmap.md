# Battleship ZK — Roadmap de Implementação

**Data:** 2026-02-21
**Escopo:** Arcade ZK → PvP ZK (incremental, validável por etapa)

---

## Princípio

Cada etapa é pequena, isolada e validável antes de avançar.
Nunca integrar duas camadas ao mesmo tempo sem validar cada uma.

---

## Design dos Circuits

### Circuit 1: `board_validity`

```
Private:  board: [[u8; 6]; 6]   // células ocupadas (0 = vazio, 1 = navio)
          nonce: Field

Public:   board_hash: Field      // Poseidon(board, nonce)
          ship_count: u8
          ship_sizes: [u8; 3]   // ex: [2, 2, 3]

Constraints:
  - board_hash == Poseidon(board, nonce)
  - cada navio tem tamanho correto (horizontal ou vertical)
  - navios não se sobrepõem
  - todos dentro dos limites 6x6
```

### Circuit 2: `shot_proof`

```
Private:  board: [[u8; 6]; 6]   // tabuleiro da AI
          nonce: Field

Public:   board_hash: Field      // deve bater com o commitado
          row: u8
          col: u8
          is_hit: bool           // computado pelo circuit, não input externo

Constraints:
  - board_hash == Poseidon(board, nonce)
  - is_hit == (board[row][col] == 1)
```

### Circuit 3: `turns_proof`

```
Private:  board_player: [[u8; 6]; 6]
          board_ai: [[u8; 6]; 6]
          nonce_player: Field
          nonce_ai: Field

Public:   board_hash_player: Field
          board_hash_ai: Field
          attacks_player: [(u8, u8); N]   // ataques do player no tabuleiro da AI
          attacks_ai: [(u8, u8); M]       // ataques da AI no tabuleiro do player
          winner: u8                      // 0 = player, 1 = AI

Constraints:
  - board_hash_player == Poseidon(board_player, nonce_player)
  - board_hash_ai     == Poseidon(board_ai, nonce_ai)
  - para cada (row, col) em attacks_player: hit = (board_ai[row][col] == 1)
  - para cada (row, col) em attacks_ai:    hit = (board_player[row][col] == 1)
  - winner computado internamente pelo circuit
```

---

## Arquitetura de Integração

### Quando cada prova é gerada

| Prova | Gerado por | Momento | Onde fica |
|---|---|---|---|
| `board_validity` (player) | Player | Após posicionar navios | **On-chain** (start_game) |
| `board_validity` (AI) | Game engine | Início do jogo | **On-chain** (start_game) |
| `shot_proof` | Game engine (AI) | A cada ataque do player na AI | **Local** (auditoria) |
| `turns_proof` | Game engine | Fim do jogo | **On-chain** (end_game) |

### Fluxo Arcade

```
INÍCIO
  Player posiciona navios
  → board_validity(player) + board_validity(AI)
  → soroban.startGame(hashP, proofP, hashAI, proofAI)
  → matchId salvo no GameContext

TURNOS
  Player ataca (row, col)
  → AI verifica localmente
  → [background] shot_proof(aiBoard, aiNonce, row, col)
  → ADD_SHOT_PROOF no GameContext

FIM
  Alguém perde todos os navios
  → turnsProof(boardP, boardAI, nonceP, nonceAI, attacksP, attacksAI)
  → soroban.endGame(matchId, proof, winner)
  → exibe txHash na tela
```

### Estrutura de diretórios

```
battleship-zk/
├── circuits/
│   ├── board_validity/src/main.nr
│   ├── shot_proof/src/main.nr
│   └── turns_proof/src/main.nr
│
└── frontend/src/
    ├── services/
    │   ├── zk/
    │   │   ├── zkService.ts
    │   │   └── circuits/          ← JSONs compilados (ACIR + ABI)
    │   │       ├── board_validity.json
    │   │       ├── shot_proof.json
    │   │       └── turns_proof.json
    │   └── soroban/
    │       └── sorobanService.ts
    └── types/
        └── zk.ts
```

### ZK Service API

```typescript
// src/services/zk/zkService.ts

boardValidity(board: number[][], nonce: string): Promise<{ proof: Uint8Array, boardHash: string }>

shotProof(board: number[][], nonce: string, row: number, col: number): Promise<{ proof: Uint8Array, isHit: boolean }>

turnsProof(
  boardPlayer: number[][], noncePlayer: string,
  boardAI: number[][], nonceAI: string,
  attacksPlayer: [number, number][],
  attacksAI: [number, number][]
): Promise<{ proof: Uint8Array, winner: 0 | 1 }>
```

### Soroban Service API

```typescript
// src/services/soroban/sorobanService.ts

startGame(hashPlayer: string, proofPlayer: Uint8Array, hashAI: string, proofAI: Uint8Array): Promise<{ matchId: string }>

endGame(matchId: string, turnsProof: Uint8Array, winner: 0 | 1): Promise<{ txHash: string }>
```

### GameContext — ZK State

```typescript
// Adicionar em GameState:
zkState?: {
  matchId: string | null
  playerBoard: number[][]
  aiBoard: number[][]
  playerNonce: string
  aiNonce: string
  playerBoardHash: string
  aiBoardHash: string
  shotProofs: ShotProofRecord[]
}

// Novas actions:
| { type: 'INIT_ZK'; zkState: ZKState }
| { type: 'ADD_SHOT_PROOF'; proof: ShotProofRecord }
```

---

## Roadmap — Bloco 1: Circuits

> **Sem tocar no app. Validar com `nargo test` antes de avançar.**

| Etapa | Tarefa | Valida |
|---|---|---|
| E1 | Escrever `board_validity.nr` + testes | `nargo test` verde |
| E2 | Escrever `shot_proof.nr` + testes | `nargo test` verde |
| E3 | Escrever `turns_proof.nr` + testes | `nargo test` verde |

---

## Roadmap — Bloco 2: ZK Service

> **Isolado do jogo. Validar no browser console antes de avançar.**

| Etapa | Tarefa | Valida |
|---|---|---|
| E4 | Instalar NoirJS + bb.js, criar `zkService.ts` com `boardValidity()` | Proof gerada no browser |
| E5 | Adicionar `shotProof()` ao zkService | Proof gerada no browser |
| E6 | Adicionar `turnsProof()` ao zkService | Proof gerada no browser |

---

## Roadmap — Bloco 3: Conversão de Dados

> **Bridge entre o engine existente e o ZK. Validar com unit tests.**

| Etapa | Tarefa | Valida |
|---|---|---|
| E7 | Utilitários: `PlacedShips[] → number[][]`, `generateNonce()`, `Board → matrix` | Unit tests corretos |

---

## Roadmap — Bloco 4: Arcade ZK no App

> **Sem Soroban ainda. Inspecionar provas no DevTools.**

| Etapa | Tarefa | Valida |
|---|---|---|
| E8 | `placement.tsx`: gera `board_validity` (player + AI) → salva no GameContext | Provas no estado, jogo avança |
| E9 | `battle.tsx`: a cada ataque do player, AI gera `shot_proof` → salva localmente | Array de provas cresce por turno |
| E10 | `gameover.tsx`: gera `turns_proof` → confirma vencedor → exibe resultado | Winner do circuit bate com o do jogo |

---

## Roadmap — Bloco 5: Soroban

> **On-chain. Validar com 2 txs confirmadas na Stellar testnet.**

| Etapa | Tarefa | Valida |
|---|---|---|
| E11 | Escrever contrato `battleship` (Rust/Soroban) + deploy testnet | Contrato deployado |
| E12 | `sorobanService.ts`: `startGame()` após placement proofs | TX 1 confirmada |
| E13 | `sorobanService.ts`: `endGame()` após turns_proof + exibir txHash | TX 2 confirmada, link na tela |

---

## Roadmap — Bloco 6: PvP Prep

> **Refactor sem quebrar Arcade.**

| Etapa | Tarefa | Valida |
|---|---|---|
| E14 | Refatorar `zkService` para suportar 2 humanos (player A e B) | Arcade continua funcionando |
| E15 | Definir schema Convex (apenas schema, sem backend) | Schema tipado e revisado |

---

## Roadmap — Bloco 7: Backend PvP (Convex)

> **Validar com 2 instâncias do browser.**

| Etapa | Tarefa | Valida |
|---|---|---|
| E16 | Setup Convex + matchmaking básico | 2 browsers se encontram |
| E17 | Coordenação de turnos + verificação `shot_proof` off-chain | Turno alternado funciona |
| E18 | Integração Soroban ↔ Convex (`open_match` / `close_match`) | TX on-chain disparada pelo backend |

---

## Roadmap — Bloco 8: Frontend PvP

> **Validar partida completa end-to-end com ZK + settlement.**

| Etapa | Tarefa | Valida |
|---|---|---|
| E19 | `pvp-lobby` + `pvp-mode`: conectar ao Convex realtime | Lobby funcional, estado sincronizado |
| E20 | Fluxo completo PvP com provas ZK + settlement on-chain | Partida PvP end-to-end |

---

## Referências

- [BattleZips-Noir](https://github.com/BattleZips/BattleZips-Noir)
- [Noir Docs](https://noir-lang.org/docs/)
- [NoirJS Tutorial](https://noir-lang.org/docs/tutorials/noirjs_app/)
- [noir-react-native-starter](https://github.com/madztheo/noir-react-native-starter)
- [UltraHonk Soroban Verifier](https://github.com/yugocabrio/rs-soroban-ultrahonk)
- [Stellar ZK Proofs (Protocol 25)](https://developers.stellar.org/docs/build/apps/zk)
- [Convex Docs](https://docs.convex.dev/)
