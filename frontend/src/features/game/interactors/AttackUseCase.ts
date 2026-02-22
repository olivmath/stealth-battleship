import { IGameRepository } from '../interfaces/IGameRepository';
import { Position, AttackResult } from '../../../types/game';
import { processAttack } from '../../../engine/board';

export class AttackUseCase {
  constructor(private gameRepo: IGameRepository) {}

  async execute(position: Position): Promise<AttackResult | null> {
    const state = await this.gameRepo.getGameState();
    if (!state || !state.isPlayerTurn) return null;

    // Delegate core logic to domain function (or BoardEntity in future)
    const { newBoard, newShips, result, shipId } = processAttack(
      state.opponentBoard,
      state.opponentShips,
      position
    );

    // Update state
    const newState = {
      ...state,
      opponentBoard: newBoard,
      opponentShips: newShips,
      isPlayerTurn: false, // Switch turn
    };

    // If result is sunk, check win condition
    if (result === 'sunk') {
       // Logic for win check can be here or in another service
    }

    await this.gameRepo.saveGameState(newState);
    return result;
  }
}
