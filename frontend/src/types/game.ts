export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export type Orientation = 'horizontal' | 'vertical';

export type GamePhase = 'login' | 'menu' | 'placement' | 'battle' | 'gameOver';

export type AIMode = 'hunt' | 'target';

export type AttackResult = 'hit' | 'miss' | 'sunk';

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  state: CellState;
  shipId: string | null;
}

export interface ShipDefinition {
  id: string;
  name: string;
  size: number;
}

export interface PlacedShip {
  id: string;
  name: string;
  size: number;
  positions: Position[];
  orientation: Orientation;
  hits: number;
  isSunk: boolean;
}

export type Board = Cell[][];

export interface AIState {
  mode: AIMode;
  hitStack: Position[];
  targetQueue: Position[];
  firedPositions: Set<string>;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  totalShots: number;
  totalHits: number;
}

export interface GameState {
  playerName: string;
  phase: GamePhase;
  playerBoard: Board;
  opponentBoard: Board;
  playerShips: PlacedShip[];
  opponentShips: PlacedShip[];
  isPlayerTurn: boolean;
  winner: 'player' | 'opponent' | null;
  ai: AIState;
  stats: PlayerStats;
  shotsFired: number;
  shotsHit: number;
}

export type GameAction =
  | { type: 'SET_PLAYER'; name: string }
  | { type: 'LOAD_STATS'; stats: PlayerStats }
  | { type: 'PLACE_SHIP'; ship: PlacedShip }
  | { type: 'REMOVE_SHIP'; shipId: string }
  | { type: 'START_GAME'; opponentShips: PlacedShip[]; opponentBoard: Board }
  | { type: 'PLAYER_ATTACK'; position: Position; result: AttackResult; shipId?: string }
  | { type: 'AI_ATTACK'; position: Position; result: AttackResult; shipId?: string; aiState: AIState }
  | { type: 'END_GAME'; winner: 'player' | 'opponent' }
  | { type: 'RESET_GAME' };
