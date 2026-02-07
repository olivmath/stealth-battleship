import { AIState, Position, Board, PlacedShip, AttackResult, DifficultyLevel } from '../types/game';
import { GRID_SIZE, DIFFICULTY_CONFIG } from '../constants/game';
import { isValidPosition, posKey, processAttack } from './board';

export function createInitialAIState(): AIState {
  return {
    mode: 'hunt',
    hitStack: [],
    targetQueue: [],
    firedPositions: new Set<string>(),
  };
}

function getCheckerboardTargets(fired: Set<string>, gridSize: number = GRID_SIZE): Position[] {
  const targets: Position[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if ((row + col) % 2 === 0 && !fired.has(posKey({ row, col }))) {
        targets.push({ row, col });
      }
    }
  }
  return targets;
}

function getAllAvailableTargets(fired: Set<string>, gridSize: number = GRID_SIZE): Position[] {
  const targets: Position[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!fired.has(posKey({ row, col }))) {
        targets.push({ row, col });
      }
    }
  }
  return targets;
}

function getOrthogonalNeighbors(pos: Position, fired: Set<string>, gridSize: number = GRID_SIZE): Position[] {
  const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  return deltas
    .map(([dr, dc]) => ({ row: pos.row + dr, col: pos.col + dc }))
    .filter(p => isValidPosition(p.row, p.col, gridSize) && !fired.has(posKey(p)));
}

function pickCenterWeighted(targets: Position[], gridSize: number): Position {
  const center = (gridSize - 1) / 2;
  const maxDist = center * Math.SQRT2;
  const weights = targets.map(t => {
    const dist = Math.sqrt((t.row - center) ** 2 + (t.col - center) ** 2);
    return maxDist - dist + 1;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return targets[i];
  }
  return targets[targets.length - 1];
}

function detectAxisAndFilter(hits: Position[], queue: Position[], fired: Set<string>, gridSize: number = GRID_SIZE): Position[] {
  if (hits.length < 2) return queue;

  const sameRow = hits.every(h => h.row === hits[0].row);
  const sameCol = hits.every(h => h.col === hits[0].col);

  if (sameRow) {
    const row = hits[0].row;
    const cols = hits.map(h => h.col);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    const filtered: Position[] = [];
    if (minCol - 1 >= 0 && !fired.has(posKey({ row, col: minCol - 1 }))) {
      filtered.push({ row, col: minCol - 1 });
    }
    if (maxCol + 1 < gridSize && !fired.has(posKey({ row, col: maxCol + 1 }))) {
      filtered.push({ row, col: maxCol + 1 });
    }
    return filtered;
  }

  if (sameCol) {
    const col = hits[0].col;
    const rows = hits.map(h => h.row);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const filtered: Position[] = [];
    if (minRow - 1 >= 0 && !fired.has(posKey({ row: minRow - 1, col }))) {
      filtered.push({ row: minRow - 1, col });
    }
    if (maxRow + 1 < gridSize && !fired.has(posKey({ row: maxRow + 1, col }))) {
      filtered.push({ row: maxRow + 1, col });
    }
    return filtered;
  }

  return queue;
}

export function computeAIMove(
  ai: AIState,
  board: Board,
  ships: PlacedShip[],
  gridSize: number = GRID_SIZE,
  difficulty: DifficultyLevel = 'normal'
): { position: Position; newAI: AIState } {
  const config = DIFFICULTY_CONFIG[difficulty];
  const newAI: AIState = {
    mode: ai.mode,
    hitStack: [...ai.hitStack],
    targetQueue: [...ai.targetQueue],
    firedPositions: new Set(ai.firedPositions),
  };

  let position: Position;

  if (newAI.mode === 'target' && newAI.targetQueue.length > 0) {
    position = newAI.targetQueue.shift()!;
    while (newAI.firedPositions.has(posKey(position)) && newAI.targetQueue.length > 0) {
      position = newAI.targetQueue.shift()!;
    }
    if (newAI.firedPositions.has(posKey(position))) {
      newAI.mode = 'hunt';
    }
  }

  if (newAI.mode === 'hunt' || (newAI.mode === 'target' && newAI.targetQueue.length === 0 && newAI.hitStack.length === 0)) {
    let targets: Position[];
    if (config.useCheckerboard) {
      targets = getCheckerboardTargets(newAI.firedPositions, gridSize);
      if (targets.length === 0) {
        targets = getAllAvailableTargets(newAI.firedPositions, gridSize);
      }
    } else {
      targets = getAllAvailableTargets(newAI.firedPositions, gridSize);
    }

    if (config.centerWeight) {
      position = pickCenterWeighted(targets, gridSize);
    } else {
      position = targets[Math.floor(Math.random() * targets.length)];
    }
    newAI.mode = 'hunt';
  }

  newAI.firedPositions.add(posKey(position!));
  return { position: position!, newAI };
}

export function updateAIAfterAttack(
  ai: AIState,
  position: Position,
  result: AttackResult,
  sunkShipId?: string,
  ships?: PlacedShip[],
  gridSize: number = GRID_SIZE,
  difficulty: DifficultyLevel = 'normal'
): AIState {
  const config = DIFFICULTY_CONFIG[difficulty];
  const newAI: AIState = {
    mode: ai.mode,
    hitStack: [...ai.hitStack],
    targetQueue: [...ai.targetQueue],
    firedPositions: new Set(ai.firedPositions),
  };

  if (result === 'miss') {
    if (newAI.targetQueue.length === 0 && newAI.hitStack.length === 0) {
      newAI.mode = 'hunt';
    }
    return newAI;
  }

  if (result === 'hit') {
    newAI.mode = 'target';
    newAI.hitStack.push(position);
    const neighbors = getOrthogonalNeighbors(position, newAI.firedPositions, gridSize);
    newAI.targetQueue.push(...neighbors);
    if (config.useAxisDetection) {
      newAI.targetQueue = detectAxisAndFilter(newAI.hitStack, newAI.targetQueue, newAI.firedPositions, gridSize);
    }
    return newAI;
  }

  if (result === 'sunk' && sunkShipId && ships) {
    const sunkShip = ships.find(s => s.id === sunkShipId);
    if (sunkShip) {
      const sunkKeys = new Set(sunkShip.positions.map(posKey));
      newAI.hitStack = newAI.hitStack.filter(h => !sunkKeys.has(posKey(h)));
      newAI.targetQueue = newAI.targetQueue.filter(t => !newAI.firedPositions.has(posKey(t)));
    }

    if (newAI.hitStack.length > 0) {
      newAI.mode = 'target';
      newAI.targetQueue = [];
      for (const hit of newAI.hitStack) {
        const neighbors = getOrthogonalNeighbors(hit, newAI.firedPositions, gridSize);
        newAI.targetQueue.push(...neighbors);
      }
      if (config.useAxisDetection) {
        newAI.targetQueue = detectAxisAndFilter(newAI.hitStack, newAI.targetQueue, newAI.firedPositions, gridSize);
      }
    } else {
      newAI.mode = 'hunt';
      newAI.targetQueue = [];
    }
    return newAI;
  }

  return newAI;
}
