import { digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';
import { Board, PlacedShip, GameCommitment } from '../types/game';

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

export async function computeBoardCommitment(
  board: Board,
  ships: PlacedShip[]
): Promise<GameCommitment> {
  const boardStr = serializeBoard(board);
  const shipsStr = serializeShipPositions(ships);

  const [boardHash, shipPositionHash] = await Promise.all([
    digestStringAsync(CryptoDigestAlgorithm.SHA256, boardStr),
    digestStringAsync(CryptoDigestAlgorithm.SHA256, shipsStr),
  ]);

  return {
    boardHash,
    shipPositionHash,
    timestamp: Date.now(),
  };
}
