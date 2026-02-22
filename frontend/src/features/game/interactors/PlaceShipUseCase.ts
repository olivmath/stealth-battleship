import { IGameRepository } from '../interfaces/IGameRepository';
import { BoardEntity } from '../entities/Board';
import { Position, Orientation, ShipDefinition } from '../../../types/game';
import { calculatePositions } from '../../../engine/shipPlacement';

export class PlaceShipUseCase {
  constructor(private gameRepo: IGameRepository) {}

  async execute(ship: ShipDefinition, origin: Position, orientation: Orientation): Promise<boolean> {
    const state = await this.gameRepo.getGameState();
    if (!state) throw new Error('Game not started');

    const positions = calculatePositions(origin, ship.size, orientation);
    const board = new BoardEntity(state.playerBoard);

    if (board.isOccupied(positions)) return false;

    // Create the updated board
    let updatedBoard = board;
    positions.forEach(p => {
      updatedBoard = updatedBoard.updateCell(p, { state: 'ship', shipId: ship.id });
    });

    // Create the placed ship object
    const placedShip = {
      id: ship.id,
      name: ship.name,
      size: ship.size,
      positions,
      orientation,
      hits: 0,
      isSunk: false
    };

    // Update state
    await this.gameRepo.saveGameState({
      ...state,
      playerBoard: updatedBoard.grid,
      playerShips: [...state.playerShips, placedShip]
    });

    return true;
  }
}
