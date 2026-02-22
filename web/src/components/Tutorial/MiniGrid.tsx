import React from 'react';
import { COLORS } from '../../shared/theme';

type CellType = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk' | 'water';

interface MiniGridProps {
  grid?: CellType[][];
  cells?: CellType[][];
  cellSize?: number;
}

const typeColors: Record<CellType, string> = {
  empty: COLORS.cell.empty,
  ship: COLORS.cell.ship,
  hit: COLORS.cell.hit,
  miss: COLORS.cell.miss,
  sunk: COLORS.cell.sunk,
  water: COLORS.background.medium,
};

export function MiniCell({ type, size = 20 }: { type: CellType; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 2,
      backgroundColor: typeColors[type],
      border: `1px solid ${COLORS.grid.border}`,
      display: 'inline-block',
    }} />
  );
}

export function MiniGrid({ grid: gridProp, cells, cellSize = 20 }: MiniGridProps) {
  const grid = gridProp ?? cells ?? [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {grid.map((row, r) => (
        <div key={r} style={{ display: 'flex', gap: 1 }}>
          {row.map((cell, c) => (
            <div key={c} style={{
              width: cellSize, height: cellSize, borderRadius: 2,
              backgroundColor: typeColors[cell],
              border: `1px solid ${COLORS.grid.border}`,
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}
