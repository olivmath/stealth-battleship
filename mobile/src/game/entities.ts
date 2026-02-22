// Re-export shared types used by game domain
export type {
  CellState, Orientation, GamePhase, AIMode, AttackResult,
  Position, Cell, ShipDefinition, PlacedShip, Board, AIState,
  GameState, GameAction, BattleTracking, Move, GameCommitment,
} from '../shared/entities';

import { Board, Cell, Position, AttackResult } from '../shared/entities';
import { GRID_SIZE } from '../shared/constants';
import { PlacedShip, Orientation } from '../shared/entities';

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
    const newGrid = this._grid.map(row => [...row]);
    shipPositions.forEach(p => {
      newGrid[p.row][p.col] = { state: 'sunk', shipId: newGrid[p.row][p.col].shipId };
    });
    return new BoardEntity(newGrid);
  }
}

export class ShipEntity {
  constructor(private readonly data: PlacedShip) {}

  public get id(): string { return this.data.id; }
  public get size(): string { return this.data.name; }
  public get isSunk(): boolean { return this.data.hits >= this.data.size; }
  public get positions(): Position[] { return this.data.positions; }

  public hit(): ShipEntity {
    if (this.isSunk) return this;

    return new ShipEntity({
      ...this.data,
      hits: this.data.hits + 1,
      isSunk: this.data.hits + 1 >= this.data.size
    });
  }

  public static create(
    id: string, name: string, size: number,
    positions: Position[], orientation: Orientation
  ): ShipEntity {
    return new ShipEntity({
      id, name, size, positions, orientation,
      hits: 0, isSunk: false
    });
  }

  public toData(): PlacedShip {
    return { ...this.data };
  }
}
