# AI Bot — Como funciona

## Visão Geral

O bot usa um algoritmo clássico de **Hunt & Target** com duas otimizações:
- **Paridade de tabuleiro (checkerboard)** no modo Hunt
- **Detecção de eixo** no modo Target

O resultado é um adversário de nível intermediário que nunca desperdiça tiros em posições redundantes e mata navios de forma eficiente uma vez que encontra o primeiro acerto.

---

## Máquina de Estados

```
┌──────────┐   hit    ┌──────────┐
│   HUNT   │ ───────► │  TARGET  │
│          │ ◄─────── │          │
└──────────┘  sunk /  └──────────┘
              miss+vazio
```

| Estado | Objetivo | Estratégia |
|--------|----------|------------|
| **HUNT** | Encontrar navios | Tiro aleatório com filtro checkerboard |
| **TARGET** | Afundar navio encontrado | Explorar vizinhos ortogonais do acerto |

---

## Estrutura de Dados (AIState)

```typescript
interface AIState {
  mode: 'hunt' | 'target';
  hitStack: Position[];        // Acertos do navio atual sendo atacado
  targetQueue: Position[];     // Fila de posições candidatas para o próximo tiro
  firedPositions: Set<string>; // Todas posições já atacadas (dedup O(1))
}
```

- `hitStack` acumula acertos enquanto o navio não afunda
- `targetQueue` contém vizinhos ortogonais dos acertos, refinados por detecção de eixo
- `firedPositions` usa chave `"row,col"` para lookup O(1)

---

## Algoritmo Detalhado

### 1. Modo HUNT — Busca com Paridade

No modo hunt, o bot seleciona alvos usando **padrão de tabuleiro de xadrez**:

```
 X · X · X ·      Onde X = célula elegível
 · X · X · X      (row + col) % 2 === 0
 X · X · X ·
 · X · X · X
 X · X · X ·
 · X · X · X
```

**Por que funciona:** Como o menor navio tem tamanho 2, ele sempre ocupa pelo menos uma célula do padrão checkerboard. Isso reduz o espaço de busca pela metade (~18 alvos em 6x6 vs 36).

Se todas as células do checkerboard foram esgotadas, o bot faz fallback para **todas as posições disponíveis**.

Em ambos os casos, a seleção é **aleatória** dentro do pool filtrado.

### 2. Transição HUNT → TARGET

Quando um tiro resulta em `hit`:
1. Bot muda para modo `target`
2. Posição do acerto é adicionada ao `hitStack`
3. Os 4 vizinhos ortogonais (↑ ↓ ← →) são adicionados ao `targetQueue`
4. Vizinhos já atacados ou fora do grid são filtrados

### 3. Modo TARGET — Exploração Inteligente

O bot despacha tiros da `targetQueue` em ordem FIFO. Quando há 2+ acertos no `hitStack`, ativa a **detecção de eixo**:

#### Detecção de Eixo

Se os acertos estão **todos na mesma linha**:
```
 · · · · · ·
 · · H H · ·   ← acertos em (1,2) e (1,3)
 · · · · · ·
```
→ Queue fica apenas: `(1,1)` e `(1,4)` (extremidades da linha)

Se os acertos estão **todos na mesma coluna**:
```
 · · · ·
 · H · ·   ← acertos em (1,1) e (2,1)
 · H · ·
 · · · ·
```
→ Queue fica apenas: `(0,1)` e `(3,1)` (extremidades da coluna)

**Resultado:** Elimina tiros perpendiculares desnecessários quando a orientação do navio é conhecida.

### 4. Tratamento de Navio Afundado (SUNK)

Quando um tiro afunda um navio:
1. Remove posições do navio afundado do `hitStack`
2. Remove posições já atacadas do `targetQueue`
3. **Se sobram acertos no hitStack** (de outro navio):
   - Permanece em modo `target`
   - Reconstrói queue com vizinhos dos acertos restantes
   - Aplica detecção de eixo novamente
4. **Se hitStack fica vazio**:
   - Volta ao modo `hunt`
   - Limpa queue

### 5. Tratamento de Miss

- Se queue e hitStack estão ambos vazios → volta ao modo `hunt`
- Caso contrário, permanece em `target` (continua tentando próximo candidato)

---

## Fluxo de um Turno da IA

```
1. Espera delay (1000ms fixo, futuro: variável por dificuldade)
2. computeAIMove(aiState, playerBoard, playerShips, gridSize)
   ├── Se TARGET e queue não vazia → dequeue próximo alvo
   ├── Se HUNT → seleciona aleatório do checkerboard
   └── Registra posição em firedPositions
3. processAttack(board, ships, position) → result
4. updateAIAfterAttack(newAI, position, result, sunkShipId?, ships)
   ├── miss → talvez volta a HUNT
   ├── hit → TARGET + expande vizinhos + detecta eixo
   └── sunk → limpa navio + decide HUNT ou continua TARGET
5. dispatch(AI_ATTACK) → atualiza estado no GameContext
6. Checa condição de vitória
7. Devolve turno ao jogador
```

---

## Níveis de Dificuldade

| Aspecto | Easy | Normal | Hard |
|---------|------|--------|------|
| Busca Hunt | Aleatório puro | Checkerboard | Checkerboard + peso no centro |
| Detecção de Eixo | Desativada | Ativa | Ativa |
| Delay do tiro | 1400–2000ms | 800–1200ms | 400–700ms |
| Multiplicador XP | 0.5x | 1.0x | 1.5x |

**Easy:** O bot atira em posições completamente aleatórias e não otimiza o targeting. Demora mais entre tiros.

**Normal:** Comportamento padrão — checkerboard hunt + axis detection + exploração inteligente.

**Hard:** Além do comportamento normal, prioriza células centrais no modo hunt (onde navios são estatisticamente mais prováveis). Tiros mais rápidos.

---

## Arquivos Relevantes

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/engine/ai.ts` | Lógica core: `computeAIMove`, `updateAIAfterAttack` |
| `src/types/game.ts` | Interface `AIState`, tipo `AIMode` |
| `src/context/GameContext.tsx` | Armazena e propaga `aiState` entre turnos |
| `app/battle.tsx` | Integração: timing, sequência de turnos, haptics |
| `src/engine/board.ts` | `processAttack` avalia resultado do tiro |
| `src/constants/game.ts` | `GRID_SIZE`, delays, config de dificuldade |
