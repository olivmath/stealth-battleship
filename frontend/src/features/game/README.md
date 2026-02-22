# Game Feature - IATE Architecture

This directory implements the Game feature using the **IATE** (Interactor, Adapter, Translator, Entity) pattern.

## Structure

- **Entities** (`/entities`): Pure domain logic and data structures.
  - `BoardEntity`: Manages the game grid state.
  - `ShipEntity`: Manages ship state (hits, sunk status).
  
- **Interactors** (`/interactors`): Application Business Logic (Use Cases).
  - `StartGameUseCase`: Initializes a new game.
  - `PlaceShipUseCase`: Handles ship placement logic.
  - `AttackUseCase`: Handles attack logic.
  
- **Interfaces** (`/interfaces`): Ports/Contracts for external dependencies.
  - `IGameRepository`: Interface for data persistence.
  
- **Adapters** (`/adapters`): Implementations of interfaces.
  - `InMemoryGameRepository`: In-memory implementation of `IGameRepository`.
  
- **Presentation** (`/presentation`): React hooks/components (Translator).
  - `useGameController`: React hook that translates UI events to Use Case executions.
  
- **Main** (`/main`): Composition Root.
  - `GameDI`: Wires up dependencies and exports the `GameModule`.

## Usage

Use the `useGameController` hook in your React components:

```tsx
import { useGameController } from '../features/game/presentation/useGameController';

function GameComponent() {
  const { gameState, placeShip, attack } = useGameController();
  // ...
}
```
