import { ShipDefinition, GridSizeOption } from '../types/game';

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

export function getShipDefinitions(gridSize: GridSizeOption): ShipDefinition[] {
  return gridSize === 10 ? CLASSIC_SHIPS : COMPACT_SHIPS;
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
