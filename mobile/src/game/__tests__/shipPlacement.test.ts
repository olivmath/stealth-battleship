import { calculatePositions, validatePlacement, placeShip, autoPlaceShips } from '../engine';
import { createEmptyBoard } from '../engine';
import { ShipDefinition } from '../../shared/entities';

// --- calculatePositions ---

describe('calculatePositions', () => {
  it('calculates horizontal positions', () => {
    const positions = calculatePositions({ row: 0, col: 0 }, 3, 'horizontal');
    expect(positions).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);
  });

  it('calculates vertical positions', () => {
    const positions = calculatePositions({ row: 1, col: 2 }, 2, 'vertical');
    expect(positions).toEqual([
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ]);
  });

  it('returns single position for size 1', () => {
    const positions = calculatePositions({ row: 3, col: 3 }, 1, 'horizontal');
    expect(positions).toEqual([{ row: 3, col: 3 }]);
  });

  it('calculates positions starting from non-zero origin', () => {
    const positions = calculatePositions({ row: 2, col: 3 }, 4, 'horizontal');
    expect(positions).toHaveLength(4);
    expect(positions[0]).toEqual({ row: 2, col: 3 });
    expect(positions[3]).toEqual({ row: 2, col: 6 });
  });
});

// --- validatePlacement ---

describe('validatePlacement', () => {
  it('validates placement within bounds', () => {
    const board = createEmptyBoard(6);
    const positions = calculatePositions({ row: 0, col: 0 }, 3, 'horizontal');
    expect(validatePlacement(board, positions, 6)).toBe(true);
  });

  it('rejects placement out of bounds (horizontal overflow)', () => {
    const board = createEmptyBoard(6);
    const positions = calculatePositions({ row: 0, col: 4 }, 3, 'horizontal');
    expect(validatePlacement(board, positions, 6)).toBe(false);
  });

  it('rejects placement out of bounds (vertical overflow)', () => {
    const board = createEmptyBoard(6);
    const positions = calculatePositions({ row: 4, col: 0 }, 3, 'vertical');
    expect(validatePlacement(board, positions, 6)).toBe(false);
  });

  it('rejects placement on occupied cell', () => {
    const board = createEmptyBoard(6);
    board[0][1] = { state: 'ship', shipId: 'existing' };
    const positions = calculatePositions({ row: 0, col: 0 }, 3, 'horizontal');
    expect(validatePlacement(board, positions, 6)).toBe(false);
  });

  it('accepts placement on completely empty cells', () => {
    const board = createEmptyBoard(10);
    const positions = calculatePositions({ row: 5, col: 5 }, 5, 'horizontal');
    expect(validatePlacement(board, positions, 10)).toBe(true);
  });

  it('validates correctly for 10x10 grid', () => {
    const board = createEmptyBoard(10);
    const positions = calculatePositions({ row: 0, col: 0 }, 5, 'horizontal');
    expect(validatePlacement(board, positions, 10)).toBe(true);
  });
});

// --- placeShip ---

describe('placeShip', () => {
  const patrol: ShipDefinition = { id: 'patrol', name: 'Patrol Boat', size: 2 };

  it('places ship and returns new board + placedShip', () => {
    const board = createEmptyBoard(6);
    const result = placeShip(board, patrol, { row: 0, col: 0 }, 'horizontal', 6);

    expect(result).not.toBeNull();
    expect(result!.newBoard[0][0]).toEqual({ state: 'ship', shipId: 'patrol' });
    expect(result!.newBoard[0][1]).toEqual({ state: 'ship', shipId: 'patrol' });
    expect(result!.newBoard[0][2].state).toBe('empty');

    expect(result!.placedShip.id).toBe('patrol');
    expect(result!.placedShip.size).toBe(2);
    expect(result!.placedShip.hits).toBe(0);
    expect(result!.placedShip.isSunk).toBe(false);
    expect(result!.placedShip.positions).toHaveLength(2);
  });

  it('returns null for invalid placement', () => {
    const board = createEmptyBoard(6);
    const result = placeShip(board, patrol, { row: 0, col: 5 }, 'horizontal', 6);
    expect(result).toBeNull();
  });

  it('does not mutate original board', () => {
    const board = createEmptyBoard(6);
    placeShip(board, patrol, { row: 0, col: 0 }, 'horizontal', 6);
    expect(board[0][0].state).toBe('empty');
  });

  it('places vertical ship correctly', () => {
    const board = createEmptyBoard(6);
    const destroyer: ShipDefinition = { id: 'destroyer', name: 'Destroyer', size: 3 };
    const result = placeShip(board, destroyer, { row: 0, col: 0 }, 'vertical', 6);

    expect(result).not.toBeNull();
    expect(result!.newBoard[0][0].shipId).toBe('destroyer');
    expect(result!.newBoard[1][0].shipId).toBe('destroyer');
    expect(result!.newBoard[2][0].shipId).toBe('destroyer');
    expect(result!.placedShip.orientation).toBe('vertical');
  });
});

// --- autoPlaceShips ---

describe('autoPlaceShips', () => {
  const compactShips: ShipDefinition[] = [
    { id: 'patrol', name: 'Patrol Boat', size: 2 },
    { id: 'cruiser', name: 'Cruiser', size: 2 },
    { id: 'destroyer', name: 'Destroyer', size: 3 },
  ];

  it('places all ships on 6x6 grid', () => {
    const board = createEmptyBoard(6);
    const result = autoPlaceShips(board, compactShips, 6);

    expect(result).not.toBeNull();
    expect(result!.ships).toHaveLength(3);
    result!.ships.forEach(ship => {
      expect(ship.hits).toBe(0);
      expect(ship.isSunk).toBe(false);
    });
  });

  it('places ships without overlap', () => {
    const board = createEmptyBoard(6);
    const result = autoPlaceShips(board, compactShips, 6)!;

    const occupiedCells = new Set<string>();
    result.ships.forEach(ship => {
      ship.positions.forEach(pos => {
        const key = `${pos.row},${pos.col}`;
        expect(occupiedCells.has(key)).toBe(false);
        occupiedCells.add(key);
      });
    });
  });

  it('marks board cells as ship', () => {
    const board = createEmptyBoard(6);
    const result = autoPlaceShips(board, compactShips, 6)!;

    let shipCellCount = 0;
    result.board.forEach(row => {
      row.forEach(cell => {
        if (cell.state === 'ship') shipCellCount++;
      });
    });
    expect(shipCellCount).toBe(7); // 2 + 2 + 3
  });

  it('works on 10x10 grid with classic fleet', () => {
    const classicShips: ShipDefinition[] = [
      { id: 'carrier', name: 'Carrier', size: 5 },
      { id: 'battleship', name: 'Battleship', size: 4 },
      { id: 'cruiser', name: 'Cruiser', size: 3 },
      { id: 'submarine', name: 'Submarine', size: 3 },
      { id: 'destroyer', name: 'Destroyer', size: 2 },
    ];
    const board = createEmptyBoard(10);
    const result = autoPlaceShips(board, classicShips, 10);

    expect(result).not.toBeNull();
    expect(result!.ships).toHaveLength(5);
  });

  it('does not mutate original board', () => {
    const board = createEmptyBoard(6);
    autoPlaceShips(board, compactShips, 6);
    board.forEach(row => {
      row.forEach(cell => {
        expect(cell.state).toBe('empty');
      });
    });
  });
});
