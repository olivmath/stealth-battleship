import { InMemoryGameRepository } from '../adapter';
import { StartGameUseCase, PlaceShipUseCase, AttackUseCase } from '../interactor';

describe('Game Features Integration', () => {
  it('should initialize game, place ship, and attack', async () => {
    const repository = new InMemoryGameRepository();
    const start = new StartGameUseCase(repository);
    const placeShip = new PlaceShipUseCase(repository);
    const attack = new AttackUseCase(repository);

    // 1. Start Game
    const state = await start.execute('Player1');
    expect(state).toBeDefined();
    expect(state.phase).toBe('placement');
    expect(state.playerName).toBe('Player1');

    // 2. Place Ship
    const ship = { id: 's1', name: 'Destroyer', size: 2 };
    const placed = await placeShip.execute(ship, { row: 0, col: 0 }, 'horizontal');
    expect(placed).toBe(true);

    const newState = await repository.getGameState();
    expect(newState).toBeDefined();
    // Verify ship is on board
    expect(newState?.playerBoard[0][0].state).toBe('ship');
    expect(newState?.playerShips).toHaveLength(1);

    // 3. Attack (Player turn)
    if (newState) {
      newState.isPlayerTurn = true;
      await repository.saveGameState(newState);
    }

    const attackResult = await attack.execute({ row: 0, col: 0 });
    expect(attackResult).toBeDefined();
    // Since opponent board is empty initially in StartGameUseCase
    expect(attackResult).toBe('miss');
  });
});
