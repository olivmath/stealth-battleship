// PvP entity types — pure types, zero deps

export type PvPPhase =
  | 'idle'
  | 'connecting'
  | 'searching'
  | 'found'
  | 'placing'
  | 'waiting_opponent'
  | 'battle'
  | 'finished'
  | 'error'
  | 'reconnecting';

export interface PvPMatch {
  matchId: string;
  opponentKey: string;       // hex pubkey
  gridSize: number;
  phase: PvPPhase;
  isMyTurn: boolean;
  turnNumber: number;
  turnDeadline?: number;     // unix ms
  winner?: string;           // hex pubkey
  winReason?: string;
}

export interface PvPIncomingAttack {
  row: number;
  col: number;
  turnNumber: number;
}

export interface PvPResultConfirmed {
  row: number;
  col: number;
  result: 'hit' | 'miss';
  turnNumber: number;
}

export interface PvPGameOver {
  winner: string;
  reason: string;
  turnNumber?: number;
}
