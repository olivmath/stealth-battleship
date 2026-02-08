import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

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
    <View style={{
      width: size,
      height: size,
      backgroundColor: CELL_BG[type],
      borderWidth: 1,
      borderColor: CELL_BORDER[type],
      borderRadius: rounded ? 2 : 0,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {type === 'hit' && <View style={styles.hitDot} />}
      {type === 'miss' && <View style={styles.missDot} />}
      {type === 'sunk' && <View style={styles.sunkX} />}
    </View>
  );
}

export function MiniGrid({ cells }: { cells: MiniCellType[][] }) {
  return (
    <View style={styles.grid}>
      {cells.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((cell, ci) => (
            <MiniCell key={`${ri}-${ci}`} type={cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  hitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.marker.miniHit,
  },
  missDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.marker.miniMiss,
    opacity: 0.7,
  },
  sunkX: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.marker.miniSunk,
    transform: [{ rotate: '45deg' }],
  },
});
