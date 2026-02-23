// Battle entity types

export const TURN_TIMEOUT_MS = 30_000; // 30 seconds per turn
export const TURN_TIMEOUT_GRACE_MS = 2_000; // 2s grace after timeout

export interface PlacementReadyPayload {
  matchId: string;
  boardHash: string;
  proof: number[];
  timestamp: number;
  signature: string;
}

export interface AttackPayload {
  matchId: string;
  row: number;
  col: number;
  timestamp: number;
  signature: string;
}

export interface ShotResultPayload {
  matchId: string;
  row: number;
  col: number;
  result: 'hit' | 'miss';
  proof: number[];
  timestamp: number;
  signature: string;
}

export interface ForfeitPayload {
  matchId: string;
}
