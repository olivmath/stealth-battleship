import React from 'react';
import { COLORS } from '../../shared/theme';

export type MiniCellType = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk' | 'water';

const CELL_BG: Record<MiniCellType, string> = {
  empty: COLORS.surface.cardBorder,
  ship: COLORS.grid.ship,
  hit: COLORS.accent.fire,
  miss: COLORS.cell.miss,
  sunk: COLORS.cell.sunk,
  water: COLORS.surface.subtle,
};

const CELL_BORDER: Record<MiniCellType, string> = {
  empty: COLORS.grid.border,
  ship: COLORS.grid.shipLight,
  hit: COLORS.accent.fireDark,
  miss: COLORS.marker.sunkShip,
  sunk: COLORS.accent.fireDark,
  water: COLORS.surface.cardBorder,
};

export function MiniCell({ type, size = 18 }: { type: MiniCellType; size?: number }) {
  const rounded = type === 'hit' || type === 'miss';
  return (
    <div style={{
      width: size,
      height: size,
      backgroundColor: CELL_BG[type],
      border: `1px solid ${CELL_BORDER[type]}`,
      borderRadius: rounded ? 2 : 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      {type === 'hit' && (
        <div style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: COLORS.marker.miniHit,
        }} />
      )}
      {type === 'miss' && (
        <div style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: COLORS.marker.miniMiss,
          opacity: 0.7,
        }} />
      )}
      {type === 'sunk' && (
        <div style={{
          width: 10,
          height: 10,
          backgroundColor: COLORS.marker.miniSunk,
          transform: 'rotate(45deg)',
        }} />
      )}
    </div>
  );
}

export function MiniGrid({ cells }: { cells: MiniCellType[][] }) {
  return (
    <div style={{
      border: `1px solid ${COLORS.grid.border}`,
      display: 'inline-flex',
      flexDirection: 'column',
      alignSelf: 'center',
    }}>
      {cells.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', flexDirection: 'row' }}>
          {row.map((cell, ci) => (
            <MiniCell key={`${ri}-${ci}`} type={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}
