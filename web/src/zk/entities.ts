import type { PlacedShip, ShotRecord } from '../shared/entities';

/** Ship tuple matching Noir circuit format: (row, col, size, horizontal) */
export type ShipTuple = [number, number, number, boolean];

/** 5 classic ships for 10x10 grid */
export type ShipTuples = [ShipTuple, ShipTuple, ShipTuple, ShipTuple, ShipTuple];

/** Attack coordinate pair: [row, col] */
export type AttackTuple = [number, number];

/** Number of ships in standard game */
export const NUM_SHIPS = 5;

/** Max attacks = 10x10 grid */
export const MAX_ATTACKS = 100;

/** Input for board_validity circuit */
export interface BoardValidityInput {
  ships: ShipTuples;
  nonce: string; // Field as decimal string
}

/** Result from board_validity proof */
export interface BoardValidityResult {
  proof: Uint8Array;
  boardHash: string; // Field as hex string
}

/** Input for shot_proof circuit */
export interface ShotProofInput {
  ships: ShipTuples;
  nonce: string;
  boardHash: string;
  row: number;
  col: number;
  isHit: boolean;
}

/** Result from shot_proof proof */
export interface ShotProofResult {
  proof: Uint8Array;
  isHit: boolean;
}

/** Input for turns_proof circuit */
export interface TurnsProofInput {
  shipsPlayer: ShipTuples;
  shipsAi: ShipTuples;
  noncePlayer: string;
  nonceAi: string;
  boardHashPlayer: string;
  boardHashAi: string;
  attacksPlayer: AttackTuple[];
  attacksAi: AttackTuple[];
  shipSizes: [number, number, number, number, number];
  winner: 0 | 1;
}

/** Result from turns_proof proof */
export interface TurnsProofResult {
  proof: Uint8Array;
  winner: 0 | 1;
}

/** Callback for proof generation progress */
export type OnProgressCallback = (step: string) => void;

/** Abstract ZK provider — swap implementation without changing consumers */
export interface ZKProvider {
  init(): Promise<void>;
  boardValidity(input: BoardValidityInput, onProgress?: OnProgressCallback): Promise<BoardValidityResult>;
  shotProof(input: ShotProofInput, onProgress?: OnProgressCallback): Promise<ShotProofResult>;
  turnsProof(input: TurnsProofInput, onProgress?: OnProgressCallback): Promise<TurnsProofResult>;
  destroy(): void;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Convert PlacedShip[] to ShipTuples for ZK circuits */
export function toShipTuples(ships: PlacedShip[]): ShipTuples {
  if (ships.length !== NUM_SHIPS) {
    throw new Error(`Expected ${NUM_SHIPS} ships, got ${ships.length}`);
  }
  return ships.map((s): ShipTuple => {
    const row = s.positions[0].row;
    const col = s.positions[0].col;
    const horizontal = s.orientation === 'horizontal';
    return [row, col, s.size, horizontal];
  }) as ShipTuples;
}

/** Convert ShotRecord[] to AttackTuple[] for ZK circuits */
export function toAttackTuples(shots: ShotRecord[]): AttackTuple[] {
  return shots.map((s) => [s.position.row, s.position.col]);
}
