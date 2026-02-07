import { Board, Position, Orientation, PlacedShip, ShipDefinition } from '../types/game';
import { GRID_SIZE } from '../constants/game';

export function calculatePositions(
  origin: Position,
  size: number,
  orientation: Orientation
): Position[] {
  const positions: Position[] = [];
  for (let i = 0; i < size; i++) {
    positions.push({
      row: origin.row + (orientation === 'vertical' ? i : 0),
      col: origin.col + (orientation === 'horizontal' ? i : 0),
    });
  }
  return positions;
}

export function validatePlacement(
  board: Board,
  positions: Position[],
  gridSize: number = GRID_SIZE
): boolean {
  return positions.every(
    p =>
      p.row >= 0 &&
      p.row < gridSize &&
      p.col >= 0 &&
      p.col < gridSize &&
      board[p.row][p.col].state === 'empty'
  );
}

export function placeShip(
  board: Board,
  ship: ShipDefinition,
  origin: Position,
  orientation: Orientation,
  gridSize: number = GRID_SIZE
): { newBoard: Board; placedShip: PlacedShip } | null {
  const positions = calculatePositions(origin, ship.size, orientation);

  if (!validatePlacement(board, positions, gridSize)) {
    return null;
  }

  const newBoard = board.map(r => r.map(c => ({ ...c })));
  positions.forEach(p => {
    newBoard[p.row][p.col] = { state: 'ship', shipId: ship.id };
  });

  const placedShip: PlacedShip = {
    id: ship.id,
    name: ship.name,
    size: ship.size,
    positions,
    orientation,
    hits: 0,
    isSunk: false,
  };

  return { newBoard, placedShip };
}

export function autoPlaceShips(
  board: Board,
  shipDefs: ShipDefinition[],
  gridSize: number = GRID_SIZE
): { board: Board; ships: PlacedShip[] } | null {
  let currentBoard = board.map(r => r.map(c => ({ ...c })));
  const ships: PlacedShip[] = [];

  for (const shipDef of shipDefs) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const maxRow = orientation === 'vertical' ? gridSize - shipDef.size : gridSize - 1;
      const maxCol = orientation === 'horizontal' ? gridSize - shipDef.size : gridSize - 1;
      const origin: Position = {
        row: Math.floor(Math.random() * (maxRow + 1)),
        col: Math.floor(Math.random() * (maxCol + 1)),
      };

      const result = placeShip(currentBoard, shipDef, origin, orientation, gridSize);
      if (result) {
        currentBoard = result.newBoard;
        ships.push(result.placedShip);
        placed = true;
      }
      attempts++;
    }

    if (!placed) return null;
  }

  return { board: currentBoard, ships };
}
