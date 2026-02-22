import { LocalAIStrategy, MockPvPStrategy } from '../engine';
import { createInitialAIState } from '../engine';
import { createEmptyBoard, posKey } from '../engine';
import { placeShip } from '../engine';
import { ShipDefinition, Board, PlacedShip } from '../../shared/entities';

// --- Helpers ---

function setupBoard(gridSize: number = 6) {
  const board = createEmptyBoard(gridSize);
  const ship: ShipDefinition = { id: 'patrol-1', name: 'Patrol Boat', size: 2 };
  const result = placeShip(board, ship, { row: 2, col: 2 }, 'horizontal', gridSize)!;
  return { board: result.newBoard, ships: [result.placedShip] };
}

// --- LocalAIStrategy ---

describe('LocalAIStrategy', () => {
  it('constructs with given state', () => {
    const ai = createInitialAIState();
    const strategy = new LocalAIStrategy(ai, 6, 'normal');
    const state = strategy.getState();
    expect(state.mode).toBe('hunt');
    expect(state.firedPositions).toHaveLength(0);
  });

  it('computes a valid move', () => {
    const { board, ships } = setupBoard();
    const strategy = new LocalAIStrategy(createInitialAIState(), 6, 'normal');
    const pos = strategy.computeMove(board, ships, 6);

    expect(pos.row).toBeGreaterThanOrEqual(0);
    expect(pos.row).toBeLessThan(6);
    expect(pos.col).toBeGreaterThanOrEqual(0);
    expect(pos.col).toBeLessThan(6);
  });

  it('updates firedPositions after computeMove', () => {
    const { board, ships } = setupBoard();
    const strategy = new LocalAIStrategy(createInitialAIState(), 6, 'normal');
    const pos = strategy.computeMove(board, ships, 6);

    expect(strategy.getState().firedPositions).toContain(posKey(pos));
  });

  it('never fires at the same position twice', () => {
    const { board, ships } = setupBoard();
    const strategy = new LocalAIStrategy(createInitialAIState(), 6, 'normal');
    const fired = new Set<string>();

    for (let i = 0; i < 36; i++) {
      const pos = strategy.computeMove(board, ships, 6);
      const key = posKey(pos);
      expect(fired.has(key)).toBe(false);
      fired.add(key);
      strategy.onMoveResult(pos, 'miss');
    }
  });

  it('switches to target mode after hit', () => {
    const { board, ships } = setupBoard();
    const strategy = new LocalAIStrategy(createInitialAIState(), 6, 'normal');

    strategy.onMoveResult({ row: 2, col: 2 }, 'hit');
    expect(strategy.getState().mode).toBe('target');
    expect(strategy.getState().hitStack).toContainEqual({ row: 2, col: 2 });
  });

  it('returns to hunt mode after sunk with no remaining hits', () => {
    const sunkShip: PlacedShip = {
      id: 'patrol-1',
      name: 'Patrol Boat',
      size: 2,
      positions: [{ row: 2, col: 2 }, { row: 2, col: 3 }],
      orientation: 'horizontal',
      hits: 2,
      isSunk: true,
    };

    const { board, ships } = setupBoard();
    const strategy = new LocalAIStrategy(createInitialAIState(), 6, 'normal');

    strategy.onMoveResult({ row: 2, col: 2 }, 'hit');
    strategy.onMoveResult({ row: 2, col: 3 }, 'sunk', 'patrol-1', [sunkShip]);
    expect(strategy.getState().mode).toBe('hunt');
    expect(strategy.getState().hitStack).toHaveLength(0);
  });

  it('reset clears state', () => {
    const { board, ships } = setupBoard();
    const strategy = new LocalAIStrategy(createInitialAIState(), 6, 'normal');

    strategy.computeMove(board, ships, 6);
    strategy.onMoveResult({ row: 2, col: 2 }, 'hit');

    strategy.reset();
    const state = strategy.getState();
    expect(state.mode).toBe('hunt');
    expect(state.hitStack).toHaveLength(0);
    expect(state.targetQueue).toHaveLength(0);
    expect(state.firedPositions).toHaveLength(0);
  });

  it('works with different difficulty levels', () => {
    const { board, ships } = setupBoard();

    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      const strategy = new LocalAIStrategy(createInitialAIState(), 6, difficulty);
      const pos = strategy.computeMove(board, ships, 6);
      expect(pos.row).toBeGreaterThanOrEqual(0);
      expect(pos.col).toBeGreaterThanOrEqual(0);
    }
  });

  it('works with 10x10 grid', () => {
    const board = createEmptyBoard(10);
    const ship: ShipDefinition = { id: 'carrier', name: 'Carrier', size: 5 };
    const result = placeShip(board, ship, { row: 0, col: 0 }, 'horizontal', 10)!;
    const ships = [result.placedShip];

    const strategy = new LocalAIStrategy(createInitialAIState(), 10, 'normal');
    const pos = strategy.computeMove(result.newBoard, ships, 10);
    expect(pos.row).toBeLessThan(10);
    expect(pos.col).toBeLessThan(10);
  });
});

// --- MockPvPStrategy ---

describe('MockPvPStrategy', () => {
  it('constructs with empty fired positions', () => {
    const strategy = new MockPvPStrategy();
    const state = strategy.getState();
    expect(state.mode).toBe('hunt');
    expect(state.firedPositions).toHaveLength(0);
  });

  it('computes a valid move', () => {
    const { board, ships } = setupBoard();
    const strategy = new MockPvPStrategy();
    const pos = strategy.computeMove(board, ships, 6);

    expect(pos.row).toBeGreaterThanOrEqual(0);
    expect(pos.row).toBeLessThan(6);
  });

  it('never fires at the same position twice', () => {
    const { board, ships } = setupBoard();
    const strategy = new MockPvPStrategy();
    const fired = new Set<string>();

    for (let i = 0; i < 36; i++) {
      const pos = strategy.computeMove(board, ships, 6);
      const key = posKey(pos);
      expect(fired.has(key)).toBe(false);
      fired.add(key);
    }
  });

  it('onMoveResult is a no-op', () => {
    const strategy = new MockPvPStrategy();
    // Should not throw
    strategy.onMoveResult({ row: 0, col: 0 }, 'hit');
    strategy.onMoveResult({ row: 0, col: 1 }, 'miss');
    strategy.onMoveResult({ row: 0, col: 2 }, 'sunk', 'ship-1', []);
  });

  it('getState returns fresh hunt state', () => {
    const strategy = new MockPvPStrategy();
    const { board, ships } = setupBoard();

    strategy.computeMove(board, ships, 6);
    const state = strategy.getState();
    // MockPvP always returns initial AI state (it doesn't track AI state)
    expect(state.mode).toBe('hunt');
    expect(state.hitStack).toHaveLength(0);
  });

  it('reset clears fired positions', () => {
    const strategy = new MockPvPStrategy();
    const { board, ships } = setupBoard();

    strategy.computeMove(board, ships, 6);
    strategy.computeMove(board, ships, 6);
    strategy.reset();

    // After reset, first cell should be available again
    // (no fired positions to skip)
    const fired = new Set<string>();
    for (let i = 0; i < 36; i++) {
      const pos = strategy.computeMove(board, ships, 6);
      fired.add(posKey(pos));
    }
    expect(fired.size).toBe(36);
  });
});
