# Architecture Document: Battleship ZK

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK) |
| Language | TypeScript |
| Navigation | expo-router (file-based) |
| State | React Context + useReducer |
| Storage | @react-native-async-storage/async-storage |
| Animations | react-native-reanimated |
| Haptics | expo-haptics |
| Gradients | expo-linear-gradient |
| Fonts | Orbitron + Rajdhani (expo-font / Google Fonts) |

## Project Structure

```
battleship-zk/
├── app/                              # expo-router screens
│   ├── _layout.tsx                   # Root layout: GameProvider + fonts
│   ├── index.tsx                     # Login screen
│   ├── menu.tsx                      # Main menu + stats
│   ├── placement.tsx                 # Ship placement
│   ├── battle.tsx                    # Core gameplay
│   └── gameover.tsx                  # Results + replay
├── src/
│   ├── types/game.ts                 # All TypeScript interfaces
│   ├── constants/
│   │   ├── theme.ts                  # Colors, fonts, spacing
│   │   └── game.ts                   # Grid size, ship definitions
│   ├── context/GameContext.tsx        # useReducer state management
│   ├── engine/
│   │   ├── board.ts                  # Board logic (pure functions)
│   │   ├── ai.ts                     # Hunt/target AI algorithm
│   │   └── shipPlacement.ts          # Placement validation
│   ├── hooks/
│   │   ├── useHaptics.ts             # Haptic feedback wrapper
│   │   └── useStorage.ts             # AsyncStorage helpers
│   ├── components/
│   │   ├── Board/
│   │   │   ├── GameBoard.tsx         # 6x6 grid renderer
│   │   │   ├── Cell.tsx              # Single cell (React.memo)
│   │   │   └── CoordinateLabels.tsx  # A-F / 1-6 labels
│   │   ├── Ship/
│   │   │   ├── ShipSelector.tsx      # Ship selection bar
│   │   │   └── ShipPreview.tsx       # Ghost overlay
│   │   ├── Battle/
│   │   │   ├── TurnIndicator.tsx     # Turn status display
│   │   │   └── FleetStatus.tsx       # Remaining ships
│   │   └── UI/
│   │       ├── NavalButton.tsx       # Styled button
│   │       └── GradientContainer.tsx # Dark gradient wrapper
│   └── storage/scores.ts            # AsyncStorage CRUD
└── assets/                           # Reference images
```

## Architecture Decisions

### 1. Pure Function Game Engine

All game logic in `src/engine/` is implemented as **pure functions** — no side effects, no state mutation. Functions receive state and return new state.

**Rationale:** Enables unit testing without UI, and prepares the codebase for future ZK proof integration where deterministic computation is essential.

```
processAttack(board, position) → { newBoard, result }
checkWinCondition(board) → boolean
calculatePositions(origin, size, orientation) → Position[]
```

### 2. useReducer over useState

Game state is managed via `useReducer` in a React Context.

**Rationale:** Game state has many interdependent fields (two boards, turn, game phase, ships). A reducer centralizes state transitions and makes them predictable. Actions are explicit and debuggable.

**Actions:**
- `SET_PLAYER` - Set player name
- `PLACE_SHIP` - Place ship on player board
- `START_GAME` - Transition to battle, auto-place AI ships
- `PLAYER_ATTACK` - Player fires at AI board
- `AI_ATTACK` - AI fires at player board
- `END_GAME` - Set winner, transition to game over
- `RESET_GAME` - Reset for new match

### 3. File-Based Routing (expo-router)

Screens are files in `app/` directory. Navigation uses `router.replace()` everywhere.

**Rationale:** Prevents back-navigation to invalid game states (e.g., returning to battle after game over). Simple, convention-based routing.

### 4. Component Composition

```
GradientContainer (background)
  └── Screen content
       ├── GameBoard
       │    ├── CoordinateLabels
       │    └── Cell[] (React.memo)
       ├── TurnIndicator / ShipSelector
       └── NavalButton
```

`Cell` uses `React.memo` with shallow comparison to prevent unnecessary re-renders when sibling cells change.

### 5. AI Architecture

```
AI State Machine:
  HUNT → random fire (checkerboard parity)
  TARGET → fire at queued neighbors of hits

Transitions:
  HUNT + hit → TARGET (queue orthogonal neighbors)
  TARGET + hit → TARGET (detect axis, filter queue)
  TARGET + sunk → check remaining hits
    - has unresolved hits → stay TARGET
    - no unresolved hits → HUNT
```

AI state is stored in the game context: `{ mode, hitStack, targetQueue }`.

### 6. Storage Schema

```typescript
// AsyncStorage keys
"@battleship_user"    → { name: string }
"@battleship_scores"  → { wins: number, losses: number, totalShots: number, totalHits: number }
```

No schema versioning needed for V1. Future versions will add migration if schema changes.

## Data Flow

```
User Action → Dispatch(action) → Reducer → New State → Re-render
                                    ↓
                              Engine functions
                              (pure computation)
```

For AI turns:
```
Player attacks → Reducer updates board → useEffect detects AI turn
  → setTimeout(600-1200ms) → AI computes target → Dispatch(AI_ATTACK)
  → Reducer updates board → Check win → useEffect detects player turn
```

## Key Constraints

1. **No network calls** in V1 — all local
2. **No sound** in V1 — haptics only
3. **6x6 grid fixed** — no configuration needed
4. **Single game mode** — vs AI only
5. **router.replace() only** — no stack-based navigation
