import { Board, PlacedShip, Position, AIState, AttackResult, DifficultyLevel } from '../types/game';
import { computeAIMove, updateAIAfterAttack, createInitialAIState } from './ai';
import { generateMockAttack } from '../services/pvpMock';
import { posKey } from './board';

export interface OpponentStrategy {
  computeMove(board: Board, ships: PlacedShip[], gridSize: number): Position;
  onMoveResult(position: Position, result: AttackResult, shipId?: string, ships?: PlacedShip[]): void;
  reset(): void;
  getState(): AIState;
}

export class LocalAIStrategy implements OpponentStrategy {
  private ai: AIState;
  private difficulty: DifficultyLevel;
  private gridSize: number;

  constructor(ai: AIState, gridSize: number, difficulty: DifficultyLevel) {
    this.ai = ai;
    this.gridSize = gridSize;
    this.difficulty = difficulty;
  }

  computeMove(board: Board, ships: PlacedShip[], gridSize: number): Position {
    const { position, newAI } = computeAIMove(this.ai, board, ships, gridSize, this.difficulty);
    this.ai = newAI;
    return position;
  }

  onMoveResult(position: Position, result: AttackResult, shipId?: string, ships?: PlacedShip[]): void {
    this.ai = updateAIAfterAttack(this.ai, position, result, shipId, ships, this.gridSize, this.difficulty);
  }

  reset(): void {
    this.ai = createInitialAIState();
  }

  getState(): AIState {
    return this.ai;
  }
}

export class MockPvPStrategy implements OpponentStrategy {
  private firedPositions: string[];

  constructor() {
    this.firedPositions = [];
  }

  computeMove(board: Board, _ships: PlacedShip[], gridSize: number): Position {
    const position = generateMockAttack(board, this.firedPositions, gridSize);
    this.firedPositions.push(posKey(position));
    return position;
  }

  onMoveResult(_position: Position, _result: AttackResult, _shipId?: string, _ships?: PlacedShip[]): void {
    // Mock PvP doesn't need to update state based on results
  }

  reset(): void {
    this.firedPositions = [];
  }

  getState(): AIState {
    return createInitialAIState();
  }
}
