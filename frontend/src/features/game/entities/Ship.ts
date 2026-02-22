import { PlacedShip, Position, Orientation } from '../../../types/game';

export class ShipEntity {
  constructor(private readonly data: PlacedShip) {}

  public get id(): string { return this.data.id; }
  public get size(): string { return this.data.name; } // Mapped name to simplify
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
