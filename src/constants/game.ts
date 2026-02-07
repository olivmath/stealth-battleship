import { ShipDefinition } from '../types/game';

export const GRID_SIZE = 6;

export const SHIP_DEFINITIONS: ShipDefinition[] = [
  { id: 'patrol-1', name: 'Patrol Boat', size: 2 },
  { id: 'patrol-2', name: 'Patrol Boat', size: 2 },
  { id: 'destroyer', name: 'Destroyer', size: 3 },
];

export const TOTAL_SHIP_CELLS = SHIP_DEFINITIONS.reduce((sum, s) => sum + s.size, 0);

export const COLUMN_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
export const ROW_LABELS = ['1', '2', '3', '4', '5', '6'];

export const AI_DELAY_MIN = 600;
export const AI_DELAY_MAX = 1200;
