import { IGameRepository } from '../interfaces/IGameRepository';
import { GameState, GamePhase } from '../../../types/game';
import { BoardEntity } from '../entities/Board';

export class StartGameUseCase {
  constructor(private gameRepo: IGameRepository) {}

  async execute(playerName: string = 'Player'): Promise<GameState> {
    const board = new BoardEntity();
    
    // Initial empty state
    const initialState: GameState = {
      playerName,
      phase: 'placement',
      playerBoard: board.grid,
      opponentBoard: board.grid, // Simplified for now
      playerShips: [],
      opponentShips: [],
      isPlayerTurn: true,
      winner: null,
      opponent: {
        mode: 'hunt',
        hitStack: [],
        targetQueue: [],
        firedPositions: []
      },
      stats: { wins: 0, losses: 0, totalShots: 0, totalHits: 0, totalXP: 0 },
      tracking: {
        turnNumber: 0,
        playerShots: [],
        opponentShots: [],
        currentStreak: 0,
        longestStreak: 0,
        opponentStreak: 0,
        opponentLongestStreak: 0,
        shipFirstHitTurn: {},
        shipSunkTurn: {}
      },
      lastMatchStats: null,
      settings: { gridSize: 6, battleView: 'stacked', difficulty: 'normal' }
    };

    await this.gameRepo.saveGameState(initialState);
    return initialState;
  }
}
