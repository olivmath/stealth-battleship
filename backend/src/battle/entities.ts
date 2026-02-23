// Battle entity types

export const TURN_TIMEOUT_MS = 30_000; // 30 seconds per turn
export const DEFENDER_RESPONSE_TIMEOUT_MS = 15_000; // 15 seconds for defender to respond

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
  sunkShipName?: string;
  sunkShipSize?: number;
}

export interface ForfeitPayload {
  matchId: string;
}
