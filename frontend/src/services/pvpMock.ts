import { Board, Position } from '../shared/entities';
import { posKey } from '../game/engine';

export const MOCK_OPPONENT = 'Captain_Nemo';

export const MATCHMAKING_DELAY = 3000;
export const FOUND_DELAY = 1500;
export const OPPONENT_READY_DELAY_MIN = 2000;
export const OPPONENT_READY_DELAY_MAX = 3000;
export const OPPONENT_ATTACK_DELAY_MIN = 1000;
export const OPPONENT_ATTACK_DELAY_MAX = 2000;
export const TURN_TIMER_SECONDS = 10;

export function generateMockAttack(
  board: Board,
  firedPositions: string[],
  gridSize: number
): Position {
  const available: Position[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const key = posKey({ row, col });
      if (!firedPositions.includes(key)) {
        available.push({ row, col });
      }
    }
  }
  return available[Math.floor(Math.random() * available.length)];
}
