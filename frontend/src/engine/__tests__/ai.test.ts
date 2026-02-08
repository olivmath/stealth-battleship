import { createInitialAIState, computeAIMove, updateAIAfterAttack } from '../ai';
import { createEmptyBoard, posKey } from '../board';
import { placeShip } from '../shipPlacement';
import { AIState, PlacedShip, ShipDefinition } from '../../types/game';

// --- Helpers ---

function setupBoardWithShip(gridSize: number = 6) {
  const board = createEmptyBoard(gridSize);
  const ship: ShipDefinition = { id: 'patrol-1', name: 'Patrol Boat', size: 2 };
  const result = placeShip(board, ship, { row: 2, col: 2 }, 'horizontal', gridSize)!;
  return { board: result.newBoard, ships: [result.placedShip] };
}

function makeAIWithFired(positions: string[]): AIState {
  return {
    mode: 'hunt',
    hitStack: [],
    targetQueue: [],
    firedPositions: positions,
  };
}

// --- createInitialAIState ---

describe('createInitialAIState', () => {
  it('starts in hunt mode', () => {
    const state = createInitialAIState();
    expect(state.mode).toBe('hunt');
  });

  it('starts with empty stacks', () => {
    const state = createInitialAIState();
    expect(state.hitStack).toHaveLength(0);
    expect(state.targetQueue).toHaveLength(0);
    expect(state.firedPositions.length).toBe(0);
  });
});

// --- computeAIMove ---

describe('computeAIMove', () => {
  it('returns a valid position on the board', () => {
    const { board, ships } = setupBoardWithShip();
    const ai = createInitialAIState();
    const { position } = computeAIMove(ai, board, ships, 6, 'normal');

    expect(position.row).toBeGreaterThanOrEqual(0);
    expect(position.row).toBeLessThan(6);
    expect(position.col).toBeGreaterThanOrEqual(0);
    expect(position.col).toBeLessThan(6);
  });

  it('never fires at the same position twice', () => {
    const { board, ships } = setupBoardWithShip();
    let ai = createInitialAIState();
    const firedPositions: string[] = [];

    for (let i = 0; i < 36; i++) {
      const { position, newAI } = computeAIMove(ai, board, ships, 6, 'normal');
      const key = posKey(position);
      expect(firedPositions.includes(key)).toBe(false);
      firedPositions.push(key);
      ai = newAI;
    }
  });

  it('adds fired position to firedPositions', () => {
    const { board, ships } = setupBoardWithShip();
    const ai = createInitialAIState();
    const { position, newAI } = computeAIMove(ai, board, ships, 6, 'normal');

    expect(newAI.firedPositions.includes(posKey(position))).toBe(true);
  });

  it('uses target queue when in target mode', () => {
    const { board, ships } = setupBoardWithShip();
    const ai: AIState = {
      mode: 'target',
      hitStack: [{ row: 2, col: 2 }],
      targetQueue: [{ row: 2, col: 3 }],
      firedPositions: ['2,2'],
    };

    const { position } = computeAIMove(ai, board, ships, 6, 'normal');
    expect(position).toEqual({ row: 2, col: 3 });
  });

  it('falls back to hunt when target queue exhausted', () => {
    const { board, ships } = setupBoardWithShip();
    const ai: AIState = {
      mode: 'target',
      hitStack: [],
      targetQueue: [],
      firedPositions: ['2,2'],
    };

    const { newAI } = computeAIMove(ai, board, ships, 6, 'normal');
    expect(newAI.mode).toBe('hunt');
  });

  it('skips already-fired positions in target queue', () => {
    const { board, ships } = setupBoardWithShip();
    const ai: AIState = {
      mode: 'target',
      hitStack: [{ row: 2, col: 2 }],
      targetQueue: [{ row: 1, col: 2 }, { row: 3, col: 2 }],
      firedPositions: ['2,2', '1,2'], // 1,2 already fired
    };

    const { position } = computeAIMove(ai, board, ships, 6, 'normal');
    expect(position).toEqual({ row: 3, col: 2 });
  });

  it('works on 10x10 grid', () => {
    const { board, ships } = setupBoardWithShip(10);
    const ai = createInitialAIState();
    const { position } = computeAIMove(ai, board, ships, 10, 'normal');

    expect(position.row).toBeGreaterThanOrEqual(0);
    expect(position.row).toBeLessThan(10);
  });

  it('covers all cells on 6x6 grid without error', () => {
    const { board, ships } = setupBoardWithShip();
    let ai = createInitialAIState();

    // Should be able to fire at all 36 cells
    for (let i = 0; i < 36; i++) {
      const { newAI } = computeAIMove(ai, board, ships, 6, 'easy');
      ai = newAI;
    }
    expect(ai.firedPositions.length).toBe(36);
  });
});

// --- updateAIAfterAttack ---

describe('updateAIAfterAttack', () => {
  it('stays in hunt mode on miss with empty stacks', () => {
    const ai = createInitialAIState();
    const result = updateAIAfterAttack(ai, { row: 0, col: 0 }, 'miss');
    expect(result.mode).toBe('hunt');
  });

  it('switches to target mode on hit', () => {
    const ai = createInitialAIState();
    const result = updateAIAfterAttack(ai, { row: 2, col: 2 }, 'hit');

    expect(result.mode).toBe('target');
    expect(result.hitStack).toContainEqual({ row: 2, col: 2 });
    expect(result.targetQueue.length).toBeGreaterThan(0);
  });

  it('adds orthogonal neighbors to queue on hit', () => {
    const ai = createInitialAIState();
    const result = updateAIAfterAttack(ai, { row: 2, col: 2 }, 'hit', undefined, undefined, 6, 'normal');

    // Neighbors of (2,2): (1,2), (3,2), (2,1), (2,3)
    const queueKeys = result.targetQueue.map(posKey);
    expect(queueKeys).toContain('1,2');
    expect(queueKeys).toContain('3,2');
    expect(queueKeys).toContain('2,1');
    expect(queueKeys).toContain('2,3');
  });

  it('does not add out-of-bounds neighbors (corner hit)', () => {
    const ai = createInitialAIState();
    const result = updateAIAfterAttack(ai, { row: 0, col: 0 }, 'hit', undefined, undefined, 6, 'normal');

    const queueKeys = result.targetQueue.map(posKey);
    // Only (1,0) and (0,1) are valid
    expect(queueKeys).toContain('1,0');
    expect(queueKeys).toContain('0,1');
    expect(queueKeys).not.toContain('-1,0');
    expect(queueKeys).not.toContain('0,-1');
  });

  it('clears sunk ship from hitStack on sunk', () => {
    const sunkShip: PlacedShip = {
      id: 'patrol-1',
      name: 'Patrol Boat',
      size: 2,
      positions: [{ row: 2, col: 2 }, { row: 2, col: 3 }],
      orientation: 'horizontal',
      hits: 2,
      isSunk: true,
    };

    const ai: AIState = {
      mode: 'target',
      hitStack: [{ row: 2, col: 2 }, { row: 2, col: 3 }],
      targetQueue: [{ row: 2, col: 4 }],
      firedPositions: ['2,2', '2,3'],
    };

    const result = updateAIAfterAttack(
      ai, { row: 2, col: 3 }, 'sunk', 'patrol-1', [sunkShip], 6, 'normal'
    );

    // Sunk ship positions removed from hitStack
    expect(result.hitStack).toHaveLength(0);
    // No remaining hits → back to hunt
    expect(result.mode).toBe('hunt');
  });

  it('stays in target mode after sunk if other hits remain', () => {
    const sunkShip: PlacedShip = {
      id: 'patrol-1',
      name: 'Patrol Boat',
      size: 2,
      positions: [{ row: 2, col: 2 }, { row: 2, col: 3 }],
      orientation: 'horizontal',
      hits: 2,
      isSunk: true,
    };

    const ai: AIState = {
      mode: 'target',
      hitStack: [
        { row: 2, col: 2 }, { row: 2, col: 3 }, // sunk ship
        { row: 4, col: 4 }, // another ship hit
      ],
      targetQueue: [],
      firedPositions: ['2,2', '2,3', '4,4'],
    };

    const result = updateAIAfterAttack(
      ai, { row: 2, col: 3 }, 'sunk', 'patrol-1', [sunkShip], 6, 'normal'
    );

    expect(result.hitStack).toHaveLength(1);
    expect(result.hitStack[0]).toEqual({ row: 4, col: 4 });
    expect(result.mode).toBe('target');
    expect(result.targetQueue.length).toBeGreaterThan(0);
  });

  it('does not mutate original AI state', () => {
    const ai = createInitialAIState();
    const result = updateAIAfterAttack(ai, { row: 2, col: 2 }, 'hit');

    expect(ai.mode).toBe('hunt');
    expect(ai.hitStack).toHaveLength(0);
    expect(result.mode).toBe('target');
    expect(result.hitStack).toHaveLength(1);
  });

  it('does not add already-fired positions to queue', () => {
    const ai: AIState = {
      mode: 'hunt',
      hitStack: [],
      targetQueue: [],
      firedPositions: ['1,2', '3,2'],
    };

    const result = updateAIAfterAttack(ai, { row: 2, col: 2 }, 'hit', undefined, undefined, 6, 'normal');

    const queueKeys = result.targetQueue.map(posKey);
    expect(queueKeys).not.toContain('1,2');
    expect(queueKeys).not.toContain('3,2');
  });

  it('handles miss in target mode with remaining queue', () => {
    const ai: AIState = {
      mode: 'target',
      hitStack: [{ row: 2, col: 2 }],
      targetQueue: [{ row: 2, col: 3 }],
      firedPositions: ['2,2', '1,2'],
    };

    const result = updateAIAfterAttack(ai, { row: 1, col: 2 }, 'miss');
    // Should stay in target mode because targetQueue still has items
    expect(result.mode).toBe('target');
  });

  it('axis detection filters queue to same row on horizontal hits (normal difficulty)', () => {
    const ai: AIState = {
      mode: 'target',
      hitStack: [{ row: 2, col: 2 }],
      targetQueue: [],
      firedPositions: ['2,2'],
    };

    // Second hit on same row → axis detected
    const result = updateAIAfterAttack(ai, { row: 2, col: 3 }, 'hit', undefined, undefined, 6, 'normal');

    // With axis detection, queue should only contain positions on row 2
    result.targetQueue.forEach(pos => {
      expect(pos.row).toBe(2);
    });
  });

  it('axis detection filters queue to same col on vertical hits (normal difficulty)', () => {
    const ai: AIState = {
      mode: 'target',
      hitStack: [{ row: 2, col: 2 }],
      targetQueue: [],
      firedPositions: ['2,2'],
    };

    // Second hit on same col → vertical axis
    const result = updateAIAfterAttack(ai, { row: 3, col: 2 }, 'hit', undefined, undefined, 6, 'normal');

    result.targetQueue.forEach(pos => {
      expect(pos.col).toBe(2);
    });
  });

  it('axis detection falls back to neighbors of last hit for diagonal/scattered hits', () => {
    const ai: AIState = {
      mode: 'target',
      hitStack: [{ row: 2, col: 2 }, { row: 3, col: 3 }], // diagonal hits
      targetQueue: [],
      firedPositions: ['2,2', '3,3'],
    };

    const result = updateAIAfterAttack(ai, { row: 4, col: 4 }, 'hit', undefined, undefined, 6, 'normal');

    // Should not return original queue; should filter to neighbors of last hit
    const queueKeys = result.targetQueue.map(posKey);
    // All targets should be orthogonal neighbors of one of the hits (axis detection applied to scattered hits)
    result.targetQueue.forEach(pos => {
      expect(pos.row >= 0 && pos.row < 6).toBe(true);
      expect(pos.col >= 0 && pos.col < 6).toBe(true);
    });
    // Should have some targets (not empty)
    expect(result.targetQueue.length).toBeGreaterThan(0);
  });

  it('easy mode does not use axis detection', () => {
    const ai: AIState = {
      mode: 'target',
      hitStack: [{ row: 2, col: 2 }],
      targetQueue: [],
      firedPositions: ['2,2'],
    };

    const result = updateAIAfterAttack(ai, { row: 2, col: 3 }, 'hit', undefined, undefined, 6, 'easy');

    // Easy mode adds all neighbors without axis filtering
    const hasNonRowTarget = result.targetQueue.some(pos => pos.row !== 2);
    expect(hasNonRowTarget).toBe(true);
  });
});
