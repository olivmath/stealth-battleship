import { Board, Cell, Position, AttackResult } from '../../../types/game';
import { GRID_SIZE } from '../../../constants/game';

export class BoardEntity {
  private readonly _grid: Board;

  constructor(grid?: Board) {
    this._grid = grid || this.createEmptyBoard();
  }

  public get grid(): Board { return this._grid; }

  private createEmptyBoard(): Board {
    return Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, (): Cell => ({ state: 'empty', shipId: null }))
    );
  }

  public getCell(pos: Position): Cell {
    if (!this.isValidPosition(pos)) throw new Error("Invalid position");
    return this._grid[pos.row][pos.col];
  }

  public isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < GRID_SIZE && pos.col >= 0 && pos.col < GRID_SIZE;
  }

  public updateCell(pos: Position, update: Partial<Cell>): BoardEntity {
    const newGrid = this._grid.map((row, r) => 
      r === pos.row ? row.map((cell, c) => 
        c === pos.col ? { ...cell, ...update } : cell
      ) : row
    );
    return new BoardEntity(newGrid);
  }

  public isOccupied(positions: Position[]): boolean {
    return positions.some(p => this.getCell(p).state !== 'empty');
  }

  public markSunk(shipPositions: Position[]): BoardEntity {
    // Optimization: Clone once, mutate copy for speed, then wrap.
    // Or map cleanly for immutability (safer but slower).
    const newGrid = this._grid.map(row => [...row]);
    shipPositions.forEach(p => {
      newGrid[p.row][p.col] = { state: 'sunk', shipId: newGrid[p.row][p.col].shipId };
    });
    return new BoardEntity(newGrid);
  }
}
