# Product Requirements Document: Battleship ZK — V3

## Overview

**Product:** Battleship ZK - Mobile naval combat game
**Platform:** iOS & Android (React Native / Expo)
**Version:** 3.0.0 (ZK-Ready Refactor)
**Status:** Planning
**Previous:** PRD-v2.md (V2 — Feature-Complete Single Player, completed)

## Vision

Transformar o MVP visual em uma base sólida para integração ZK, PvP real-time via Supabase, e web3. Esta versão foca em: eliminar dívida técnica (~1.550 LOC duplicadas), preparar o modelo de dados para provas criptográficas, implementar progressão por nível com grids desbloqueáveis, adicionar i18n trilíngue, e polir a UX para retenção de jogadores.

## Prioridades (definidas pelo product owner)

1. **ZK-Ready** — Preparar arquitetura para provas zero-knowledge e Supabase PvP
2. **Code Cleanup** — Eliminar duplicação, bugs, e dívida técnica
3. **UX Polish** — Melhorar fluxos, animações, e experiência do jogador

## Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Backend PvP | Supabase (Realtime) | Onde ZK e web3 vão viver |
| Grid por nível | Sim | Ranks desbloqueiam grids maiores e navios novos |
| i18n | PT-BR, EN, ES | Configurável pelo usuário |
| Animações | Reanimated (usar de verdade) | Manter dependência e implementar corretamente |
| Modelo 3D | Manter, lazy-load | Alta qualidade, mas otimizar memória |
| Test framework | Jest + Maestro | Jest pro engine, Maestro pra E2E mobile |
| overkillShots | Implementar tracking real | Remover código morto, integrar na fórmula |

---

## Sistema de Progressão por Nível (NOVO)

Grid e navios agora são desbloqueados por rank, não escolhidos em settings.

| Rank | XP | Grid | Navios |
|------|-----|------|--------|
| Recruit | 0 | 6x6 | 2x tamanho 1, 1x tamanho 2 |
| Ensign | 2.000 | 6x6 | 2x tamanho 2, 1x tamanho 3 |
| Lieutenant | 6.000 | 8x8 | 2x tamanho 2, 1x tamanho 3, 1x tamanho 4 |
| Commander | 15.000 | 8x8 | 1x tamanho 2, 2x tamanho 3, 1x tamanho 4 |
| Captain | 30.000 | 10x10 | 1x tamanho 2, 1x tamanho 3, 2x tamanho 4, 1x tamanho 5 |
| Admiral | 60.000 | 10x10 | Frota completa clássica (2+3+3+4+5) |

---

## Epics, Milestones & Tasks

### Resumo dos Epics

| # | Epic | Tasks | LOC impacto | Prioridade |
|---|------|-------|-------------|------------|
| E1 | Test Infrastructure | 5 | +450 | P0 (fundação) |
| E2 | ZK-Ready Architecture | 9 | +435 | P1 (norte do projeto) |
| E3 | Code Consolidation | 14 | -1.245 | P1 (desbloqueia tudo) |
| E4 | Progressive Grid System | 5 | +140 | P2 (game design) |
| E5 | Internationalization (i18n) | 4 | +580 | P2 (antes de mexer em telas) |
| E6 | UX & Animations | 10 | +390 | P3 (polish final) |

---

## E1 — Test Infrastructure

```
E1 Test Infrastructure
├── M1.1 Unit Test Setup
│   ├── T1.1.1 Configurar Jest + React Native Testing Library
│   │         - jest.config.ts, setup files, mocks do Expo
│   │         - Scripts no package.json: test, test:watch, test:coverage
│   │
│   ├── T1.1.2 Testes unitários: board.ts
│   │         - createEmptyBoard (6x6, 8x8, 10x10)
│   │         - processAttack (hit, miss, sunk)
│   │         - checkWinCondition (true/false)
│   │         - isValidPosition (bounds checking)
│   │
│   ├── T1.1.3 Testes unitários: shipPlacement.ts
│   │         - calculatePositions (horizontal, vertical)
│   │         - validatePlacement (bounds, collision)
│   │         - autoPlaceShips (all ships placed, no overlap)
│   │
│   └── T1.1.4 Testes unitários: stats.ts
│             - calculateScore (victory, defeat, perfect, overkill)
│             - computeMatchStats (accuracy, efficiency, streak)
│             - getLevelInfo (all 6 ranks, edge cases)
│
└── M1.2 AI Test Suite
    └── T1.2.1 Testes unitários: ai.ts
              - createInitialAIState
              - getCheckerboardTargets (6x6, 10x10)
              - computeAIMove (hunt mode, target mode)
              - updateAIAfterAttack (hit → target, sunk → hunt)
              - detectAxisAndFilter (horizontal, vertical, scattered)
              - Regression: infinite loop scenario
```

**Dependências:** Nenhuma. Pode começar imediatamente.
**Resultado:** Rede de segurança para todas as refatorações seguintes.

---

## E2 — ZK-Ready Architecture

```
E2 ZK-Ready Architecture
├── M2.1 Data Model Serialization
│   ├── T2.1.1 Trocar Set<string> → string[] em AIState.firedPositions
│   │         - types/game.ts: alterar interface AIState
│   │         - ai.ts: trocar .has() → .includes(), .add() → .push()
│   │         - GameContext.tsx: adaptar reducer
│   │         - Rodar testes do E1 para validar
│   │
│   ├── T2.1.2 Match IDs: Date.now() → UUID determinístico
│   │         - storage/scores.ts: usar crypto.randomUUID() ou hash
│   │         - Preparar para IDs on-chain
│   │
│   └── T2.1.3 Tornar BattleTracking simétrico
│             - Renomear aiShots → opponentShots
│             - Adicionar opponentStreak, opponentLongestStreak
│             - Atualizar reducer para trackear ambos os lados
│
├── M2.2 Opponent Abstraction
│   ├── T2.2.1 Renomear ai → opponent no GameState
│   │         - types/game.ts: GameState.ai → GameState.opponent
│   │         - Renomear AI_ATTACK → OPPONENT_ATTACK
│   │         - Atualizar todas as referências (13 arquivos importam GameContext)
│   │
│   └── T2.2.2 Criar interface OpponentStrategy
│             - Interface: { computeMove(), onMoveResult(), reset() }
│             - Implementação: LocalAIStrategy (usa ai.ts)
│             - Implementação: MockPvPStrategy (usa pvpMock.ts)
│             - Futura: SupabaseStrategy (Realtime channels)
│
├── M2.3 Cryptographic Commitments
│   ├── T2.3.1 Criar tipo GameCommitment
│   │         - boardHash: string (SHA-256 do board serializado)
│   │         - shipPositionHash: string (commitment das posições)
│   │         - timestamp: number
│   │
│   ├── T2.3.2 Criar tipo Move (histórico verificável)
│   │         - { turn, player, position, result, shipId?, proof? }
│   │         - Array de moves substituirá tracking redundante
│   │
│   └── T2.3.3 Gerar hash SHA-256 do board no START_GAME
│             - Serializar board deterministicamente
│             - Armazenar commitment no GameState
│             - Salvar no MatchRecord para verificação futura
│
└── M2.4 Score System Fix
    └── T2.4.1 Implementar overkillShots tracking real
              - Detectar tiros em células já reveladas (hit/miss/sunk)
              - Passar valor real para calculateScore()
              - Remover hardcode de 0 em computeMatchStats
              - Atualizar testes
```

**Dependências:** E1 (testes) deve estar completo antes de começar.
**Resultado:** Modelo de dados pronto para serialização, rede, e provas ZK.

---

## E3 — Code Consolidation

```
E3 Code Consolidation
├── M3.1 Screen Unification (-1.350 LOC)
│   ├── T3.1.1 Unificar battle.tsx + pvp-battle.tsx
│   │         - Criar BattleScreen(mode: 'arcade' | 'pvp')
│   │         - Extrair hook useBattleLoop(mode, opponentStrategy)
│   │         - Lógica de turno, haptics, win condition compartilhada
│   │         - PvP adiciona: TurnTimer, OpponentStatus
│   │         - Deletar pvp-battle.tsx
│   │
│   ├── T3.1.2 Unificar placement.tsx + pvp-placement.tsx
│   │         - Criar PlacementScreen(mode: 'arcade' | 'pvp')
│   │         - Extrair hook usePlacementTouch() (lógica do responder)
│   │         - PvP adiciona: opponent ready state, status display
│   │         - Deletar pvp-placement.tsx
│   │
│   └── T3.1.3 Unificar gameover.tsx + pvp-gameover.tsx
│             - Criar GameOverScreen(mode: 'arcade' | 'pvp')
│             - PvP adiciona: board reveal, opponent stats
│             - Deletar pvp-gameover.tsx
│
├── M3.2 Component Extraction (-140 LOC)
│   ├── T3.2.1 Extrair KillEfficiencyBar para src/components/UI/
│   │         - Remover duplicata de gameover.tsx e match-detail.tsx
│   │         - Props: { shipName, idealShots, actualShots }
│   │
│   └── T3.2.2 Extrair LevelUpModal para src/components/UI/
│             - Remover duplicata de gameover.tsx e pvp-gameover.tsx
│             - Props: { visible, oldRank, newRank, onDismiss }
│
├── M3.3 Architecture Cleanup
│   ├── T3.3.1 Mover side effects para middleware/effects layer
│   │         - saveMatchToHistory() sai das telas → entra no reducer/effect
│   │         - updateStatsAfterGame() sai das telas → entra no reducer/effect
│   │         - Criar useGameEffects() hook que escuta state changes
│   │
│   ├── T3.3.2 Adicionar try/catch em todas as operações de storage
│   │         - storage/scores.ts: wrap JSON.parse com fallback
│   │         - useStorage.ts: error state nos hooks
│   │         - Fallback gracioso para defaults em caso de corrupção
│   │
│   └── T3.3.3 Consolidar cores hardcoded no sistema de tema
│             - Cell.tsx: '#38bdf8', '#e2e8f0' → COLORS.*
│             - NavalButton.tsx: '#22c55e' → COLORS.accent.victory
│             - MiniGrid.tsx: '#ff6b6b', '#64748b', '#991b1b' → COLORS.*
│             - match-history.tsx: DIFFICULTY_COLORS → COLORS.difficulty.*
│             - Garantir consistência vitória gold vs green
│
├── M3.4 Engine Bug Fixes
│   ├── T3.4.1 Fix mutation em board.ts processAttack()
│   │         - ship.hits += 1 → spread: { ...ship, hits: ship.hits + 1 }
│   │         - ship.isSunk = true → spread: { ...ship, isSunk: true }
│   │
│   ├── T3.4.2 Fix detectAxisAndFilter() retornando queue inalterada
│   │         - Adicionar fallback quando hits são diagonais/scattered
│   │         - Prevenir retorno do queue original sem filtro
│   │
│   ├── T3.4.3 Fix kill efficiency em stats.ts
│   │         - shotsInRange conta tiros no range, não tiros no navio
│   │         - Corrigir para contar tiros que realmente atingiram o ship
│   │
│   └── T3.4.4 Fix tracking redundante no reducer
│             - Remover lógica duplicada de shipFirstHitTurn (hit + sunk)
│             - Consolidar tracking entre reducer e telas
│
└── M3.5 Performance Optimization
    ├── T3.5.1 Otimizar board deep-copy
    │         - Copiar apenas a row afetada, não board inteiro
    │         - board.map(r => r === affectedRow ? [...r] : r)
    │
    └── T3.5.2 Lazy-load WebView do modelo 3D
              - Montar WebView apenas na tela de menu
              - Desmontar ao navegar para outras telas
              - Manter ref do preload para evitar recarregar
```

**Dependências:** E1 (testes) + E2-M2.1 (serialização) devem estar completos.
**Resultado:** ~1.550 LOC eliminadas, bugs corrigidos, arquitetura limpa.

---

## E4 — Progressive Grid System

```
E4 Progressive Grid System
├── M4.1 Progression Design
│   ├── T4.1.1 Criar tabela rank → grid → navios
│   │         - Definir configs para cada rank (6 níveis)
│   │         - Incluir grid 8x8 como intermediário
│   │         - Validar que todas as configs geram placement válido
│   │
│   └── T4.1.2 Refatorar getShipDefinitions()
│             - Receber rank/level em vez de gridSize
│             - Calcular gridSize a partir do rank
│             - Manter backward compatibility via overload
│
├── M4.2 Settings & UI Update
│   ├── T4.2.1 Remover seletor de grid do Settings
│   │         - Grid agora é determinado pelo rank
│   │         - Exibir grid atual como info (não editável)
│   │         - Manter seletor de battle view e difficulty
│   │
│   └── T4.2.2 Atualizar tutorial para grid dinâmico
│             - Slides adaptam exemplos ao grid do nível atual
│             - Navios mostrados correspondem ao rank
│
└── M4.3 Unlock Notifications
    └── T4.3.1 Modal de unlock ao subir de rank
              - Mostrar: novo grid size, novos navios disponíveis
              - Animação celebratória (Reanimated)
              - Integrar com LevelUpModal existente
```

**Dependências:** E3-M3.4 (bug fixes) para garantir que engine funciona com 8x8.
**Resultado:** Progressão com propósito — ranks desbloqueiam conteúdo real.

---

## E5 — Internationalization (i18n)

```
E5 Internationalization
├── M5.1 Infrastructure
│   ├── T5.1.1 Instalar e configurar i18next + react-i18next
│   │         - Configurar detector de locale do dispositivo
│   │         - Setup de fallback (EN como default)
│   │         - Integrar com Expo Localization
│   │
│   └── T5.1.2 Criar arquivos de tradução base
│             - locales/pt-BR.json
│             - locales/en.json
│             - locales/es.json
│             - Estrutura por namespace: common, menu, battle, settings, etc
│
└── M5.2 Migration
    ├── T5.2.1 Substituir strings hardcoded por t() em todas as telas
    │         - 17 telas + 17 componentes
    │         - Manter keys semânticas: t('battle.yourTurn')
    │         - Incluir interpolação: t('menu.welcome', { name })
    │
    └── T5.2.2 Adicionar seletor de idioma no Settings
              - Picker com 3 opções: Português, English, Español
              - Persistir escolha no AsyncStorage
              - Hot-switch sem restart
```

**Dependências:** E3-M3.1 (unificação de telas) — para não traduzir código duplicado.
**Resultado:** App acessível em 3 idiomas, configurável pelo usuário.

---

## E6 — UX & Animations

```
E6 UX & Animations
├── M6.1 Navigation & Flow Fixes
│   ├── T6.1.1 Splash condicional
│   │         - Se já logado (nome no AsyncStorage), pular direto pro menu
│   │         - Splash só no primeiro acesso ou após logout
│   │
│   ├── T6.1.2 Tutorial uma vez só
│   │         - Flag hasSeenTutorial no AsyncStorage
│   │         - Resetar flag se grid mudar (rank up com novo grid)
│   │         - Botão "Review Tutorial" no settings
│   │
│   ├── T6.1.3 Navegação push em telas utilitárias
│   │         - Settings, Profile, Match History, Match Detail: router.push()
│   │         - Back gesture (iOS swipe, Android back button) funciona
│   │         - Manter replace() no fluxo de gameplay
│   │
│   └── T6.1.4 Logout com confirmação + limpeza
│             - Alert.alert de confirmação antes de navegar
│             - Limpar nome do AsyncStorage
│             - Opção: limpar stats ou manter
│
├── M6.2 Battle Feel
│   ├── T6.2.1 Animação de impacto no turno inimigo
│   │         - Flash na célula atacada (Reanimated shared value)
│   │         - Micro-shake no board ao receber hit
│   │         - Delay visual: mira → impacto → resultado
│   │
│   ├── T6.2.2 Sunk Ship Modal: tap-to-dismiss + estilo por navio
│   │         - Tocar em qualquer lugar fecha o modal
│   │         - Visual diferente por tipo de navio (cor, tamanho, ícone)
│   │         - Animação Reanimated real (substituir Animated nativo)
│   │
│   └── T6.2.3 Migrar animações para Reanimated
│             - RadarSpinner: useSharedValue + useAnimatedStyle
│             - SunkShipModal: spring physics para sinking
│             - Transições: withTiming/withSpring em vez de Animated.timing
│
├── M6.3 Menu & Visual Hierarchy
│   ├── T6.3.1 Redesenhar menu com hierarquia visual
│   │         - Start Battle: botão grande, destaque visual
│   │         - PvP Online: botão médio, accent diferente
│   │         - History/Profile/Settings: botões menores, secundários
│   │         - Logout: texto link discreto, não botão
│   │         - Stats do jogador (rank, XP, win rate) visíveis no menu
│   │
│   └── T6.3.2 Loading states consistentes
│             - RadarSpinner em todas as telas com async loading
│             - Skeleton loading para match history
│             - Eliminar tela branca no login (return null → spinner)
│
└── M6.4 Battle Report
    └── T6.4.1 Battle Report aberto por padrão no gameover
              - Remover accordion, mostrar report expandido
              - Ou: hint visual pulsante para expandir
              - Kill efficiency, streak, first blood visíveis sem toque
```

**Dependências:** E3 (consolidação) + E5 (i18n) para não refazer trabalho.
**Resultado:** App fluida, dinâmica, com animações reais e navegação natural.

---

## Ordem de Execução Recomendada

```
E1 (Testes) ──────────────────────────────┐
                                          ▼
E2 (ZK Architecture) ────────────────────┐│
                                         ▼▼
E3 (Code Consolidation) ────────────────┐
                                        ▼
                              ┌─── E4 (Grid Progressivo)
                              │
                              ├─── E5 (i18n)
                              │
                              └─── E6 (UX & Animations)
```

E1 é pré-requisito de tudo. E2 e E3 podem ser parcialmente paralelos. E4, E5, E6 podem rodar em paralelo após E3.

---

## Métricas de Sucesso

| Métrica | Antes (V2) | Depois (V3) |
|---------|-----------|-------------|
| LOC duplicadas | ~1.550 | 0 |
| Testes unitários | 0 | 50+ |
| Testes E2E | 0 | 5+ fluxos |
| Idiomas | 1 (EN hardcoded) | 3 (PT-BR, EN, ES) |
| Cores fora do tema | 15+ | 0 |
| Erros de storage sem catch | 8+ | 0 |
| Dependências fantasma | 2 | 0 |
| Telas duplicadas | 3 pares | 0 |
| Bugs conhecidos no engine | 4 | 0 |
| Board serializable para ZK | Não | Sim |
| Grid progressivo por rank | Não | Sim |

---

## Out of Scope (V4+)

- Implementação real de provas ZK (circuitos, verificadores)
- Backend Supabase (Realtime, matchmaking, auth)
- Wallet connect / web3 integration
- Staking / smart contracts
- Sound effects / music
- Achievements / badges
- Custom ship skins
- Replay viewer
- Modo espectador
