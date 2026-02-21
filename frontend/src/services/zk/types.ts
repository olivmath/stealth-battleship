/** Ship tuple matching Noir circuit format: (row, col, size, horizontal) */
export type ShipTuple = [number, number, number, boolean];

/** Input for board_validity circuit */
export interface BoardValidityInput {
  ships: [ShipTuple, ShipTuple, ShipTuple];
  nonce: string; // Field as decimal string
}

/** Result from board_validity proof */
export interface BoardValidityResult {
  proof: Uint8Array;
  boardHash: string; // Field as hex string
}

/** Input for shot_proof circuit */
export interface ShotProofInput {
  ships: [ShipTuple, ShipTuple, ShipTuple];
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
  shipsPlayer: [ShipTuple, ShipTuple, ShipTuple];
  shipsAI: [ShipTuple, ShipTuple, ShipTuple];
  noncePlayer: string;
  nonceAI: string;
  boardHashPlayer: string;
  boardHashAI: string;
  attacksPlayer: [number, number][];
  attacksAI: [number, number][];
  shipSizes: [number, number, number];
  winner: 0 | 1;
}

/** Result from turns_proof proof */
export interface TurnsProofResult {
  proof: Uint8Array;
  winner: 0 | 1;
}

/** Abstract ZK provider — swap implementation without changing consumers */
export interface ZKProvider {
  init(): Promise<void>;
  boardValidity(input: BoardValidityInput): Promise<BoardValidityResult>;
  shotProof(input: ShotProofInput): Promise<ShotProofResult>;
  turnsProof(input: TurnsProofInput): Promise<TurnsProofResult>;
  destroy(): void;
}
