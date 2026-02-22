// game/engine.ts — Pure functions: board ops, AI, ship placement, opponent strategy, crypto
// Merged from: engine/board.ts, engine/ai.ts, engine/shipPlacement.ts, engine/opponentStrategy.ts, engine/crypto.ts

import {
  Board, Cell, Position, AttackResult, PlacedShip, ShipDefinition,
  Orientation, AIState, DifficultyLevel, GameCommitment,
} from '../shared/entities';
import { GRID_SIZE, DIFFICULTY_CONFIG } from '../shared/constants';
import { generateMockAttack } from '../services/pvpMock';

// ─── Board Operations ────────────────────────────────────────────────

export function createEmptyBoard(gridSize: number = GRID_SIZE): Board {
  return Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, (): Cell => ({
      state: 'empty',
      shipId: null,
    }))
  );
}

export function processAttack(
  board: Board,
  ships: PlacedShip[],
  position: Position
): { newBoard: Board; newShips: PlacedShip[]; result: AttackResult; shipId?: string } {
  const { row, col } = position;
  const cell = board[row][col];
  const newShips = ships.map(s => {
    if (s.id !== cell.shipId) return { ...s, positions: [...s.positions] };
    const newHits = s.hits + 1;
    return { ...s, positions: [...s.positions], hits: newHits, isSunk: newHits >= s.size };
  });

  if (cell.shipId) {
    const ship = newShips.find(s => s.id === cell.shipId)!;

    if (ship.isSunk) {
      const affectedRows = new Set(ship.positions.map(p => p.row));
      const newBoard = board.map((r, i) => affectedRows.has(i) ? r.map(c => ({ ...c })) : r);
      ship.positions.forEach(p => {
        newBoard[p.row][p.col] = { state: 'sunk', shipId: ship.id };
      });
      return { newBoard, newShips, result: 'sunk', shipId: ship.id };
    }

    const newBoard = board.map((r, i) => i === row ? r.map(c => ({ ...c })) : r);
    newBoard[row][col] = { state: 'hit', shipId: cell.shipId };
    return { newBoard, newShips, result: 'hit', shipId: cell.shipId };
  }

  const newBoard = board.map((r, i) => i === row ? r.map(c => ({ ...c })) : r);
  newBoard[row][col] = { state: 'miss', shipId: null };
  return { newBoard, newShips, result: 'miss' };
}

export function checkWinCondition(ships: PlacedShip[]): boolean {
  return ships.every(s => s.isSunk);
}

export function posKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

export function isValidPosition(row: number, col: number, gridSize: number = GRID_SIZE): boolean {
  return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
}

// ─── Ship Placement ──────────────────────────────────────────────────

export function calculatePositions(
  origin: Position,
  size: number,
  orientation: Orientation
): Position[] {
  const positions: Position[] = [];
  for (let i = 0; i < size; i++) {
    positions.push({
      row: origin.row + (orientation === 'vertical' ? i : 0),
      col: origin.col + (orientation === 'horizontal' ? i : 0),
    });
  }
  return positions;
}

export function validatePlacement(
  board: Board,
  positions: Position[],
  gridSize: number = GRID_SIZE
): boolean {
  return positions.every(
    p =>
      p.row >= 0 &&
      p.row < gridSize &&
      p.col >= 0 &&
      p.col < gridSize &&
      board[p.row][p.col].state === 'empty'
  );
}

export function placeShip(
  board: Board,
  ship: ShipDefinition,
  origin: Position,
  orientation: Orientation,
  gridSize: number = GRID_SIZE
): { newBoard: Board; placedShip: PlacedShip } | null {
  const positions = calculatePositions(origin, ship.size, orientation);

  if (!validatePlacement(board, positions, gridSize)) {
    return null;
  }

  const newBoard = board.map(r => r.map(c => ({ ...c })));
  positions.forEach(p => {
    newBoard[p.row][p.col] = { state: 'ship', shipId: ship.id };
  });

  const placedShip: PlacedShip = {
    id: ship.id,
    name: ship.name,
    size: ship.size,
    positions,
    orientation,
    hits: 0,
    isSunk: false,
  };

  return { newBoard, placedShip };
}

export function autoPlaceShips(
  board: Board,
  shipDefs: ShipDefinition[],
  gridSize: number = GRID_SIZE
): { board: Board; ships: PlacedShip[] } | null {
  let currentBoard = board.map(r => r.map(c => ({ ...c })));
  const ships: PlacedShip[] = [];

  for (const shipDef of shipDefs) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const maxRow = orientation === 'vertical' ? gridSize - shipDef.size : gridSize - 1;
      const maxCol = orientation === 'horizontal' ? gridSize - shipDef.size : gridSize - 1;
      const origin: Position = {
        row: Math.floor(Math.random() * (maxRow + 1)),
        col: Math.floor(Math.random() * (maxCol + 1)),
      };

      const result = placeShip(currentBoard, shipDef, origin, orientation, gridSize);
      if (result) {
        currentBoard = result.newBoard;
        ships.push(result.placedShip);
        placed = true;
      }
      attempts++;
    }

    if (!placed) return null;
  }

  return { board: currentBoard, ships };
}

// ─── AI ──────────────────────────────────────────────────────────────

export function createInitialAIState(): AIState {
  return {
    mode: 'hunt',
    hitStack: [],
    targetQueue: [],
    firedPositions: [],
  };
}

function getCheckerboardTargets(fired: string[], gridSize: number = GRID_SIZE): Position[] {
  const targets: Position[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if ((row + col) % 2 === 0 && !fired.includes(posKey({ row, col }))) {
        targets.push({ row, col });
      }
    }
  }
  return targets;
}

function getAllAvailableTargets(fired: string[], gridSize: number = GRID_SIZE): Position[] {
  const targets: Position[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!fired.includes(posKey({ row, col }))) {
        targets.push({ row, col });
      }
    }
  }
  return targets;
}

function getOrthogonalNeighbors(pos: Position, fired: string[], gridSize: number = GRID_SIZE): Position[] {
  const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  return deltas
    .map(([dr, dc]) => ({ row: pos.row + dr, col: pos.col + dc }))
    .filter(p => isValidPosition(p.row, p.col, gridSize) && !fired.includes(posKey(p)));
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

function detectAxisAndFilter(hits: Position[], queue: Position[], fired: string[], gridSize: number = GRID_SIZE): Position[] {
  if (hits.length < 2) return queue;

  const sameRow = hits.every(h => h.row === hits[0].row);
  const sameCol = hits.every(h => h.col === hits[0].col);

  if (sameRow) {
    const row = hits[0].row;
    const cols = hits.map(h => h.col);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    const filtered: Position[] = [];
    if (minCol - 1 >= 0 && !fired.includes(posKey({ row, col: minCol - 1 }))) {
      filtered.push({ row, col: minCol - 1 });
    }
    if (maxCol + 1 < gridSize && !fired.includes(posKey({ row, col: maxCol + 1 }))) {
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
    if (minRow - 1 >= 0 && !fired.includes(posKey({ row: minRow - 1, col }))) {
      filtered.push({ row: minRow - 1, col });
    }
    if (maxRow + 1 < gridSize && !fired.includes(posKey({ row: maxRow + 1, col }))) {
      filtered.push({ row: maxRow + 1, col });
    }
    return filtered;
  }

  const lastHit = hits[hits.length - 1];
  return getOrthogonalNeighbors(lastHit, fired, gridSize);
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
    firedPositions: [...ai.firedPositions],
  };

  let position: Position;

  if (newAI.mode === 'target' && newAI.targetQueue.length > 0) {
    position = newAI.targetQueue.shift()!;
    while (newAI.firedPositions.includes(posKey(position)) && newAI.targetQueue.length > 0) {
      position = newAI.targetQueue.shift()!;
    }
    if (newAI.firedPositions.includes(posKey(position))) {
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

  newAI.firedPositions.push(posKey(position!));
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
    firedPositions: [...ai.firedPositions],
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
      newAI.targetQueue = newAI.targetQueue.filter(t => !newAI.firedPositions.includes(posKey(t)));
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

// ─── Opponent Strategy ───────────────────────────────────────────────

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

  onMoveResult(_position: Position, _result: AttackResult, _shipId?: string, _ships?: PlacedShip[]): void {}

  reset(): void {
    this.firedPositions = [];
  }

  getState(): AIState {
    return createInitialAIState();
  }
}

// ─── Crypto (Legacy SHA-256) ─────────────────────────────────────────

export function serializeBoard(board: Board): string {
  return JSON.stringify(
    board.map(row =>
      row.map(cell => ({ shipId: cell.shipId, state: cell.state }))
    )
  );
}

export function serializeShipPositions(ships: PlacedShip[]): string {
  const sorted = [...ships].sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify(
    sorted.map(s => ({
      id: s.id,
      positions: s.positions.map(p => ({ col: p.col, row: p.row })),
      size: s.size,
    }))
  );
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeBoardCommitment(
  board: Board,
  ships: PlacedShip[]
): Promise<GameCommitment> {
  const boardStr = serializeBoard(board);
  const shipsStr = serializeShipPositions(ships);

  const [boardHash, shipPositionHash] = await Promise.all([
    sha256Hex(boardStr),
    sha256Hex(shipsStr),
  ]);

  return {
    boardHash,
    shipPositionHash,
    timestamp: Date.now(),
  };
}
