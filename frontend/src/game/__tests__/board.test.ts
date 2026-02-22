import { createEmptyBoard, processAttack, checkWinCondition, posKey, isValidPosition } from '../engine';
import { Board, PlacedShip } from '../../shared/entities';

// --- Helpers ---

function makeBoardWithShip(gridSize: number = 6): { board: Board; ships: PlacedShip[] } {
  const board = createEmptyBoard(gridSize);
  const ship: PlacedShip = {
    id: 'patrol-1',
    name: 'Patrol Boat',
    size: 2,
    positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
    orientation: 'horizontal',
    hits: 0,
    isSunk: false,
  };
  board[0][0] = { state: 'ship', shipId: 'patrol-1' };
  board[0][1] = { state: 'ship', shipId: 'patrol-1' };
  return { board, ships: [ship] };
}

// --- posKey ---

describe('posKey', () => {
  it('formats position as "row,col"', () => {
    expect(posKey({ row: 0, col: 0 })).toBe('0,0');
    expect(posKey({ row: 2, col: 5 })).toBe('2,5');
    expect(posKey({ row: 9, col: 9 })).toBe('9,9');
  });
});

// --- isValidPosition ---

describe('isValidPosition', () => {
  it.each([
    [0, 0, 6, true],
    [5, 5, 6, true],
    [3, 3, 6, true],
    [-1, 0, 6, false],
    [0, -1, 6, false],
    [6, 0, 6, false],
    [0, 6, 6, false],
    [0, 0, 10, true],
    [9, 9, 10, true],
    [10, 0, 10, false],
  ])('isValidPosition(%i, %i, %i) → %s', (row, col, gridSize, expected) => {
    expect(isValidPosition(row, col, gridSize)).toBe(expected);
  });
});

// --- createEmptyBoard ---

describe('createEmptyBoard', () => {
  it.each([6, 8, 10])('creates %ix%i grid of empty cells', (size) => {
    const board = createEmptyBoard(size);
    expect(board).toHaveLength(size);
    board.forEach(row => {
      expect(row).toHaveLength(size);
      row.forEach(cell => {
        expect(cell.state).toBe('empty');
        expect(cell.shipId).toBeNull();
      });
    });
  });

  it('creates independent rows (no shared references)', () => {
    const board = createEmptyBoard(6);
    board[0][0] = { state: 'ship', shipId: 'test' };
    expect(board[1][0].state).toBe('empty');
  });
});

// --- processAttack ---

describe('processAttack', () => {
  it('returns miss for empty cell', () => {
    const { board, ships } = makeBoardWithShip();
    const { newBoard, newShips, result, shipId } = processAttack(board, ships, { row: 3, col: 3 });

    expect(result).toBe('miss');
    expect(shipId).toBeUndefined();
    expect(newBoard[3][3].state).toBe('miss');
    expect(newShips[0].hits).toBe(0);
  });

  it('returns hit for ship cell', () => {
    const { board, ships } = makeBoardWithShip();
    const { newBoard, newShips, result, shipId } = processAttack(board, ships, { row: 0, col: 0 });

    expect(result).toBe('hit');
    expect(shipId).toBe('patrol-1');
    expect(newBoard[0][0].state).toBe('hit');
    expect(newShips[0].hits).toBe(1);
    expect(newShips[0].isSunk).toBe(false);
  });

  it('returns sunk when all cells hit', () => {
    const { board, ships } = makeBoardWithShip();
    // Hit first cell
    const first = processAttack(board, ships, { row: 0, col: 0 });
    // Hit second cell (sinks it)
    const { newBoard, newShips, result, shipId } = processAttack(first.newBoard, first.newShips, { row: 0, col: 1 });

    expect(result).toBe('sunk');
    expect(shipId).toBe('patrol-1');
    expect(newShips[0].hits).toBe(2);
    expect(newShips[0].isSunk).toBe(true);
    expect(newBoard[0][0].state).toBe('sunk');
    expect(newBoard[0][1].state).toBe('sunk');
  });

  it('does not mutate original board', () => {
    const { board, ships } = makeBoardWithShip();
    processAttack(board, ships, { row: 0, col: 0 });

    expect(board[0][0].state).toBe('ship');
    expect(ships[0].hits).toBe(0);
  });

  it('does not mutate original ships array', () => {
    const { board, ships } = makeBoardWithShip();
    const { newShips } = processAttack(board, ships, { row: 0, col: 0 });

    expect(ships[0].hits).toBe(0);
    expect(newShips[0].hits).toBe(1);
    expect(ships).not.toBe(newShips);
  });

  it('works on 10x10 grid', () => {
    const { board, ships } = makeBoardWithShip(10);
    const { result } = processAttack(board, ships, { row: 9, col: 9 });
    expect(result).toBe('miss');
  });
});

// --- checkWinCondition ---

describe('checkWinCondition', () => {
  it('returns false when no ships are sunk', () => {
    const ships: PlacedShip[] = [
      { id: 'a', name: 'A', size: 2, positions: [], orientation: 'horizontal', hits: 0, isSunk: false },
      { id: 'b', name: 'B', size: 3, positions: [], orientation: 'vertical', hits: 0, isSunk: false },
    ];
    expect(checkWinCondition(ships)).toBe(false);
  });

  it('returns false when some ships are sunk', () => {
    const ships: PlacedShip[] = [
      { id: 'a', name: 'A', size: 2, positions: [], orientation: 'horizontal', hits: 2, isSunk: true },
      { id: 'b', name: 'B', size: 3, positions: [], orientation: 'vertical', hits: 0, isSunk: false },
    ];
    expect(checkWinCondition(ships)).toBe(false);
  });

  it('returns true when all ships are sunk', () => {
    const ships: PlacedShip[] = [
      { id: 'a', name: 'A', size: 2, positions: [], orientation: 'horizontal', hits: 2, isSunk: true },
      { id: 'b', name: 'B', size: 3, positions: [], orientation: 'vertical', hits: 3, isSunk: true },
    ];
    expect(checkWinCondition(ships)).toBe(true);
  });

  it('returns true for empty ships array', () => {
    expect(checkWinCondition([])).toBe(true);
  });
});
