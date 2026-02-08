jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async (_algo: string, data: string) => {
    // Simple deterministic mock: return hex-encoded length + first chars
    const hex = Buffer.from(data.slice(0, 32)).toString('hex');
    return hex.padEnd(64, '0');
  }),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

import { serializeBoard, serializeShipPositions, computeBoardCommitment } from '../crypto';
import { createEmptyBoard } from '../board';
import { placeShip } from '../shipPlacement';
import { PlacedShip, ShipDefinition } from '../../types/game';

describe('serializeBoard', () => {
  it('produces deterministic output for same board', () => {
    const board = createEmptyBoard(6);
    const a = serializeBoard(board);
    const b = serializeBoard(board);
    expect(a).toBe(b);
  });

  it('produces different output for different boards', () => {
    const board1 = createEmptyBoard(6);
    const board2 = createEmptyBoard(6);
    const ship: ShipDefinition = { id: 'p1', name: 'Patrol', size: 2 };
    const result = placeShip(board2, ship, { row: 0, col: 0 }, 'horizontal', 6)!;
    expect(serializeBoard(board1)).not.toBe(serializeBoard(result.newBoard));
  });

  it('returns valid JSON string', () => {
    const board = createEmptyBoard(6);
    expect(() => JSON.parse(serializeBoard(board))).not.toThrow();
  });
});

describe('serializeShipPositions', () => {
  it('produces deterministic output regardless of input order', () => {
    const shipA: PlacedShip = {
      id: 'alpha',
      name: 'Alpha',
      size: 2,
      positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
      orientation: 'horizontal',
      hits: 0,
      isSunk: false,
    };
    const shipB: PlacedShip = {
      id: 'bravo',
      name: 'Bravo',
      size: 3,
      positions: [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
      orientation: 'horizontal',
      hits: 0,
      isSunk: false,
    };

    const orderAB = serializeShipPositions([shipA, shipB]);
    const orderBA = serializeShipPositions([shipB, shipA]);
    expect(orderAB).toBe(orderBA);
  });

  it('returns valid JSON string', () => {
    const ship: PlacedShip = {
      id: 'p1',
      name: 'Patrol',
      size: 2,
      positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
      orientation: 'horizontal',
      hits: 0,
      isSunk: false,
    };
    expect(() => JSON.parse(serializeShipPositions([ship]))).not.toThrow();
  });

  it('only includes id, positions, and size (not hits, isSunk, etc)', () => {
    const ship: PlacedShip = {
      id: 'p1',
      name: 'Patrol',
      size: 2,
      positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
      orientation: 'horizontal',
      hits: 1,
      isSunk: false,
    };
    const serialized = serializeShipPositions([ship]);
    expect(serialized).not.toContain('hits');
    expect(serialized).not.toContain('isSunk');
    expect(serialized).not.toContain('orientation');
    expect(serialized).not.toContain('name');
  });
});

describe('computeBoardCommitment', () => {
  it('returns a valid commitment object', async () => {
    const board = createEmptyBoard(6);
    const ship: PlacedShip = {
      id: 'p1',
      name: 'Patrol',
      size: 2,
      positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
      orientation: 'horizontal',
      hits: 0,
      isSunk: false,
    };

    const commitment = await computeBoardCommitment(board, [ship]);
    expect(commitment.boardHash).toBeDefined();
    expect(typeof commitment.boardHash).toBe('string');
    expect(commitment.shipPositionHash).toBeDefined();
    expect(typeof commitment.shipPositionHash).toBe('string');
    expect(commitment.timestamp).toBeGreaterThan(0);
  });

  it('produces same hashes for same inputs', async () => {
    const board = createEmptyBoard(6);
    const ship: PlacedShip = {
      id: 'p1',
      name: 'Patrol',
      size: 2,
      positions: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
      orientation: 'horizontal',
      hits: 0,
      isSunk: false,
    };

    const c1 = await computeBoardCommitment(board, [ship]);
    const c2 = await computeBoardCommitment(board, [ship]);
    expect(c1.boardHash).toBe(c2.boardHash);
    expect(c1.shipPositionHash).toBe(c2.shipPositionHash);
  });
});
