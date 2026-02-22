import { IGameRepository } from '../interfaces/IGameRepository';
import { GameState } from '../../../types/game';

export class InMemoryGameRepository implements IGameRepository {
  private state: GameState | null = null;

  async saveGameState(state: GameState): Promise<void> {
    this.state = state;
  }

  async getGameState(): Promise<GameState | null> {
    return this.state;
  }

  async resetGame(): Promise<void> {
    this.state = null;
  }
}
