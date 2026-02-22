import { ShipDefinition, GridSizeOption, DifficultyLevel } from './entities';

// --- Rank progression config ---

export interface RankConfig {
  rank: string;
  gridSize: GridSizeOption;
  ships: ShipDefinition[];
}

// All ranks use 6x6 grid with 3 ships (ZK circuit constraint)
export const RANK_PROGRESSION: RankConfig[] = [
  {
    rank: 'Recruit',
    gridSize: 6,
    ships: [
      { id: 'patrol-1', name: 'Patrol Boat', size: 2 },
      { id: 'patrol-2', name: 'Patrol Boat', size: 2 },
      { id: 'destroyer', name: 'Destroyer', size: 3 },
    ],
  },
  {
    rank: 'Ensign',
    gridSize: 6,
    ships: [
      { id: 'patrol-1', name: 'Patrol Boat', size: 2 },
      { id: 'patrol-2', name: 'Patrol Boat', size: 2 },
      { id: 'destroyer', name: 'Destroyer', size: 3 },
    ],
  },
  {
    rank: 'Lieutenant',
    gridSize: 6,
    ships: [
      { id: 'patrol-1', name: 'Patrol Boat', size: 2 },
      { id: 'patrol-2', name: 'Patrol Boat', size: 2 },
      { id: 'destroyer', name: 'Destroyer', size: 3 },
    ],
  },
  {
    rank: 'Commander',
    gridSize: 6,
    ships: [
      { id: 'patrol-1', name: 'Patrol Boat', size: 2 },
      { id: 'patrol-2', name: 'Patrol Boat', size: 2 },
      { id: 'destroyer', name: 'Destroyer', size: 3 },
    ],
  },
  {
    rank: 'Captain',
    gridSize: 6,
    ships: [
      { id: 'patrol-1', name: 'Patrol Boat', size: 2 },
      { id: 'patrol-2', name: 'Patrol Boat', size: 2 },
      { id: 'destroyer', name: 'Destroyer', size: 3 },
    ],
  },
  {
    rank: 'Admiral',
    gridSize: 6,
    ships: [
      { id: 'patrol-1', name: 'Patrol Boat', size: 2 },
      { id: 'patrol-2', name: 'Patrol Boat', size: 2 },
      { id: 'destroyer', name: 'Destroyer', size: 3 },
    ],
  },
];

export function getRankConfig(rank: string): RankConfig {
  return RANK_PROGRESSION.find(r => r.rank === rank) ?? RANK_PROGRESSION[0];
}

export function getShipDefinitionsForRank(rank: string): ShipDefinition[] {
  return getRankConfig(rank).ships;
}

export function getGridSizeForRank(rank: string): GridSizeOption {
  return getRankConfig(rank).gridSize;
}

// --- Default grid (used as fallback) ---
export const GRID_SIZE = 6;

// --- Fleet definitions per grid size ---

export const COMPACT_SHIPS: ShipDefinition[] = [
  { id: 'patrol-1', name: 'Patrol Boat', size: 2 },
  { id: 'patrol-2', name: 'Patrol Boat', size: 2 },
  { id: 'destroyer', name: 'Destroyer', size: 3 },
];

export const CLASSIC_SHIPS: ShipDefinition[] = [
  { id: 'carrier', name: 'Carrier', size: 5 },
  { id: 'battleship', name: 'Battleship', size: 4 },
  { id: 'cruiser', name: 'Cruiser', size: 3 },
  { id: 'submarine', name: 'Submarine', size: 3 },
  { id: 'destroyer', name: 'Destroyer', size: 2 },
];

export function getShipDefinitions(_gridSize: GridSizeOption): ShipDefinition[] {
  return COMPACT_SHIPS;
}

export function getColumnLabels(gridSize: GridSizeOption): string[] {
  return 'ABCDEFGHIJ'.slice(0, gridSize).split('');
}

export function getRowLabels(gridSize: GridSizeOption): string[] {
  return Array.from({ length: gridSize }, (_, i) => String(i + 1));
}

// Backwards compat exports
export const SHIP_DEFINITIONS = COMPACT_SHIPS;
export const TOTAL_SHIP_CELLS = COMPACT_SHIPS.reduce((sum, s) => sum + s.size, 0);
export const COLUMN_LABELS = getColumnLabels(6);
export const ROW_LABELS = getRowLabels(6);

export const AI_DELAY_MIN = 600;
export const AI_DELAY_MAX = 1200;

// --- Ship-specific visual styles ---
export const SHIP_STYLES: Record<string, { color: string; label: string }> = {
  carrier: { color: '#3b82f6', label: 'Carrier' },
  battleship: { color: '#ef4444', label: 'Battleship' },
  cruiser: { color: '#22c55e', label: 'Cruiser' },
  submarine: { color: '#8b5cf6', label: 'Submarine' },
  destroyer: { color: '#f59e0b', label: 'Destroyer' },
  patrol: { color: '#06b6d4', label: 'Patrol Boat' },
  scout: { color: '#a3e635', label: 'Scout' },
};

export function getShipStyle(shipId: string): { color: string; label: string } {
  const prefix = shipId.replace(/-\d+$/, '');
  return SHIP_STYLES[prefix] ?? { color: '#4a5568', label: 'Unknown' };
}

// --- Difficulty configuration ---

export interface DifficultyConfig {
  useCheckerboard: boolean;
  useAxisDetection: boolean;
  centerWeight: boolean;
  delayMin: number;
  delayMax: number;
  scoreMultiplier: number;
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    useCheckerboard: false,
    useAxisDetection: false,
    centerWeight: false,
    delayMin: 1400,
    delayMax: 2000,
    scoreMultiplier: 0.5,
  },
  normal: {
    useCheckerboard: true,
    useAxisDetection: true,
    centerWeight: false,
    delayMin: 800,
    delayMax: 1200,
    scoreMultiplier: 1.0,
  },
  hard: {
    useCheckerboard: true,
    useAxisDetection: true,
    centerWeight: true,
    delayMin: 400,
    delayMax: 700,
    scoreMultiplier: 1.5,
  },
};
