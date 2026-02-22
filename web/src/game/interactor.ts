// game/interactor.ts — Use cases + ports (IGameRepository)
// Merged from: features/game/interactors/*.ts, features/game/interfaces/*.ts

import { Board, PlacedShip, GameState, GamePhase, Position, Orientation, ShipDefinition, AttackResult } from '../shared/entities';
import { BoardEntity } from './entities';
import { calculatePositions, processAttack } from './engine';

// ─── Port (interface) ────────────────────────────────────────────────

export interface IGameRepository {
  saveGameState(state: GameState): Promise<void>;
  getGameState(): Promise<GameState | null>;
  resetGame(): Promise<void>;
}

export interface IBoardPresenter {
  present(board: Board): void;
}

// ─── Start Game Use Case ─────────────────────────────────────────────

export class StartGameUseCase {
  constructor(private gameRepo: IGameRepository) {}

  async execute(playerName: string = 'Player'): Promise<GameState> {
    const board = new BoardEntity();

    const initialState: GameState = {
      playerName,
      phase: 'placement',
      playerBoard: board.grid,
      opponentBoard: board.grid,
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
      settings: { gridSize: 10, difficulty: 'hard' }
    };

    await this.gameRepo.saveGameState(initialState);
    return initialState;
  }
}

// ─── Place Ship Use Case ─────────────────────────────────────────────

export class PlaceShipUseCase {
  constructor(private gameRepo: IGameRepository) {}

  async execute(ship: ShipDefinition, origin: Position, orientation: Orientation): Promise<boolean> {
    const state = await this.gameRepo.getGameState();
    if (!state) throw new Error('Game not started');

    const positions = calculatePositions(origin, ship.size, orientation);
    const board = new BoardEntity(state.playerBoard);

    if (board.isOccupied(positions)) return false;

    let updatedBoard = board;
    positions.forEach(p => {
      updatedBoard = updatedBoard.updateCell(p, { state: 'ship', shipId: ship.id });
    });

    const placedShip = {
      id: ship.id,
      name: ship.name,
      size: ship.size,
      positions,
      orientation,
      hits: 0,
      isSunk: false
    };

    await this.gameRepo.saveGameState({
      ...state,
      playerBoard: updatedBoard.grid,
      playerShips: [...state.playerShips, placedShip]
    });

    return true;
  }
}

// ─── Attack Use Case ─────────────────────────────────────────────────

export class AttackUseCase {
  constructor(private gameRepo: IGameRepository) {}

  async execute(position: Position): Promise<AttackResult | null> {
    const state = await this.gameRepo.getGameState();
    if (!state || !state.isPlayerTurn) return null;

    const { newBoard, newShips, result, shipId } = processAttack(
      state.opponentBoard,
      state.opponentShips,
      position
    );

    const newState = {
      ...state,
      opponentBoard: newBoard,
      opponentShips: newShips,
      isPlayerTurn: false,
    };

    await this.gameRepo.saveGameState(newState);
    return result;
  }
}
