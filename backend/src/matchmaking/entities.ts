// Matchmaking entity types

export interface MatchRoom {
  id: string;
  status: 'waiting' | 'placing' | 'battle' | 'finished';
  gridSize: number;
  matchCode?: string;
  player1: { publicKey: string; socketId: string };
  player2?: { publicKey: string; socketId: string };
  player1BoardHash?: string;
  player2BoardHash?: string;
  player1BoardProof?: number[];
  player2BoardProof?: number[];
  player1Ready: boolean;
  player2Ready: boolean;
  currentTurn?: string;     // publicKey of current turn player
  turnNumber: number;
  attacks: Attack[];
  turnTimer?: ReturnType<typeof setTimeout>;
  defenderTimer?: ReturnType<typeof setTimeout>;
  winner?: string;          // publicKey of winner
  shipSizes: number[];
  createdAt: number;
}

export interface Attack {
  attacker: string;   // publicKey
  row: number;
  col: number;
  result?: 'hit' | 'miss';
  turnNumber: number;
  timestamp: number;
}

export interface QueueEntry {
  publicKey: string;
  socketId: string;
  gridSize: number;
  joinedAt: number;
}

// In-memory state
export const matches = new Map<string, MatchRoom>();
export const playerToMatch = new Map<string, string>();
export const matchQueue: QueueEntry[] = [];
export const matchCodeIndex = new Map<string, string>(); // matchCode → matchId

export function getShipSizes(gridSize: number): number[] {
  if (gridSize === 6) return [2, 2, 3];
  return [5, 4, 3, 3, 2]; // 10x10 classic
}
