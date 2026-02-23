// Battle entity types

export const TURN_TIMEOUT_MS = Number(process.env.TURN_TIMEOUT_MS) || 30_000;
export const DEFENDER_RESPONSE_TIMEOUT_MS = Number(process.env.DEFENDER_RESPONSE_TIMEOUT_MS) || 15_000;

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

export interface RevealPayload {
  matchId: string;
  ships: number[][];   // flat board array or ship positions
  nonce: string;        // board commitment nonce
  timestamp: number;
  signature: string;
}
