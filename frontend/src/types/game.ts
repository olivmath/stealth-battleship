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
  firedPositions: string[];
}

export interface PlayerStats {
  wins: number;
  losses: number;
  totalShots: number;
  totalHits: number;
  totalXP: number;
}

// --- Battle Tracking (raw data recorded during gameplay) ---

export interface ShotRecord {
  turn: number;
  position: Position;
  result: AttackResult;
  shipId?: string;
}

export interface BattleTracking {
  turnNumber: number;
  playerShots: ShotRecord[];
  opponentShots: ShotRecord[];
  currentStreak: number;
  longestStreak: number;
  opponentStreak: number;
  opponentLongestStreak: number;
  shipFirstHitTurn: Record<string, number>;
  shipSunkTurn: Record<string, number>;
}

// --- Derived stats (computed at game end) ---

export interface ShipKillEfficiency {
  shipId: string;
  shipName: string;
  shipSize: number;
  idealShots: number;
  actualShots: number;
}

export interface MatchStats {
  score: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
  shotsToWin: number;
  shipsSurvived: number;
  totalShips: number;
  longestStreak: number;
  firstBloodTurn: number;
  perfectKills: number;
  killEfficiency: ShipKillEfficiency[];
}

export interface MatchRecord {
  id: string;
  date: string;
  result: 'victory' | 'defeat';
  score: number;
  gridSize: number;
  difficulty: DifficultyLevel;
  stats: MatchStats;
  commitment?: GameCommitment;
}

// --- Cryptographic commitment (ZK-ready) ---

export interface GameCommitment {
  boardHash: string;
  shipPositionHash: string;
  timestamp: number;
}

export interface Move {
  turn: number;
  player: 'player' | 'opponent';
  position: Position;
  result: AttackResult;
  shipId?: string;
  proof?: string;
}

// --- Settings ---

export type GridSizeOption = 6;
export type BattleViewMode = 'stacked' | 'swipe';
export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export interface GameSettings {
  gridSize: GridSizeOption;
  battleView: BattleViewMode;
  difficulty: DifficultyLevel;
}

// --- Player level ---

export interface LevelInfo {
  rank: string;
  currentXP: number;
  xpForCurrentRank: number;
  xpForNextRank: number;
  progress: number;
  motto: string;
  gridSize: GridSizeOption;
  ships: ShipDefinition[];
}

// --- Game state ---

export interface GameState {
  playerName: string;
  phase: GamePhase;
  playerBoard: Board;
  opponentBoard: Board;
  playerShips: PlacedShip[];
  opponentShips: PlacedShip[];
  isPlayerTurn: boolean;
  winner: 'player' | 'opponent' | null;
  opponent: AIState;
  stats: PlayerStats;
  tracking: BattleTracking;
  lastMatchStats: MatchStats | null;
  settings: GameSettings;
  commitment?: GameCommitment;
}

export type GameAction =
  | { type: 'SET_PLAYER'; name: string }
  | { type: 'LOAD_STATS'; stats: PlayerStats }
  | { type: 'LOAD_SETTINGS'; settings: GameSettings }
  | { type: 'PLACE_SHIP'; ship: PlacedShip }
  | { type: 'REMOVE_SHIP'; shipId: string }
  | { type: 'START_GAME'; opponentShips: PlacedShip[]; opponentBoard: Board; commitment?: GameCommitment }
  | { type: 'PLAYER_ATTACK'; position: Position; result: AttackResult; shipId?: string }
  | { type: 'OPPONENT_ATTACK'; position: Position; result: AttackResult; shipId?: string; opponentState: AIState }
  | { type: 'END_GAME'; winner: 'player' | 'opponent'; matchStats: MatchStats }
  | { type: 'RESET_GAME' };
