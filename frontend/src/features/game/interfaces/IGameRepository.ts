import { Board, PlacedShip, GameState } from '../../../types/game';

export interface IGameRepository {
  saveGameState(state: GameState): Promise<void>;
  getGameState(): Promise<GameState | null>;
  resetGame(): Promise<void>;
}

export interface IBoardPresenter {
  present(board: Board): void;
}
