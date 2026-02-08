import { Board, Cell, Position, AttackResult, PlacedShip } from '../types/game';
import { GRID_SIZE } from '../constants/game';

export function createEmptyBoard(gridSize: number = GRID_SIZE): Board {
  return Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, (): Cell => ({
      state: 'empty',
      shipId: null,
    }))
  );
}

export function processAttack(
  board: Board,
  ships: PlacedShip[],
  position: Position
): { newBoard: Board; newShips: PlacedShip[]; result: AttackResult; shipId?: string } {
  const { row, col } = position;
  const cell = board[row][col];
  const newShips = ships.map(s => {
    if (s.id !== cell.shipId) return { ...s, positions: [...s.positions] };
    const newHits = s.hits + 1;
    return { ...s, positions: [...s.positions], hits: newHits, isSunk: newHits >= s.size };
  });

  if (cell.shipId) {
    const ship = newShips.find(s => s.id === cell.shipId)!;

    if (ship.isSunk) {
      const affectedRows = new Set(ship.positions.map(p => p.row));
      const newBoard = board.map((r, i) => affectedRows.has(i) ? r.map(c => ({ ...c })) : r);
      ship.positions.forEach(p => {
        newBoard[p.row][p.col] = { state: 'sunk', shipId: ship.id };
      });
      return { newBoard, newShips, result: 'sunk', shipId: ship.id };
    }

    const newBoard = board.map((r, i) => i === row ? r.map(c => ({ ...c })) : r);
    newBoard[row][col] = { state: 'hit', shipId: cell.shipId };
    return { newBoard, newShips, result: 'hit', shipId: cell.shipId };
  }

  const newBoard = board.map((r, i) => i === row ? r.map(c => ({ ...c })) : r);
  newBoard[row][col] = { state: 'miss', shipId: null };
  return { newBoard, newShips, result: 'miss' };
}

export function checkWinCondition(ships: PlacedShip[]): boolean {
  return ships.every(s => s.isSunk);
}

export function posKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

export function isValidPosition(row: number, col: number, gridSize: number = GRID_SIZE): boolean {
  return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
}
