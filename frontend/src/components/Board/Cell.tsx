import React, { memo } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { CellState } from '../../types/game';
import { COLORS, FONTS } from '../../constants/theme';

interface Props {
  state: CellState;
  size: number;
  onPress?: () => void;
  disabled?: boolean;
  isPreview?: boolean;
  isInvalid?: boolean;
  row?: number;
  col?: number;
  isOpponent?: boolean;
  shipColor?: string;
}

function getCellLabel(row: number | undefined, col: number | undefined, state: CellState): string {
  if (row == null || col == null) return state;
  const letter = String.fromCharCode(65 + row);
  const num = col + 1;
  return `${letter}${num}, ${state}`;
}

function CellComponent({ state, size, onPress, disabled, isPreview, isInvalid, row, col, isOpponent, shipColor }: Props) {
  const baseBgColor = shipColor && state === 'ship'
    ? shipColor
    : shipColor && state === 'sunk'
      ? `${shipColor}33`
      : getCellColor(state);

  const bgColor = isInvalid
    ? 'rgba(239, 68, 68, 0.3)'
    : isPreview
      ? 'rgba(245, 158, 11, 0.3)'
      : baseBgColor;

  const borderColor = isInvalid
    ? COLORS.accent.fire
    : isPreview
      ? COLORS.accent.gold
      : state === 'hit'
        ? COLORS.accent.fire
        : state === 'sunk'
          ? shipColor ?? COLORS.accent.fireDark
          : COLORS.grid.border;

  const label = getCellLabel(row, col, state);

  return (
    <TouchableOpacity
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor: bgColor,
          borderColor,
        },
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={isOpponent && state === 'empty' ? 'Tap to fire' : undefined}
    >
      {state === 'hit' && (
        <View style={styles.hitMarker}>
          <Text style={styles.hitMarkerText}>X</Text>
        </View>
      )}
      {state === 'miss' && (
        <View style={styles.missMarker}>
          <Text style={styles.missMarkerText}>{'\u2022'}</Text>
        </View>
      )}
      {state === 'sunk' && (
        <View style={[styles.sunkMarker, shipColor ? { backgroundColor: shipColor } : undefined]}>
          <Text style={styles.sunkMarkerText}>X</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function getCellColor(state: CellState): string {
  switch (state) {
    case 'empty': return COLORS.cell.empty;
    case 'ship': return COLORS.cell.ship;
    case 'hit': return COLORS.cell.hit;
    case 'miss': return COLORS.cell.miss;
    case 'sunk': return COLORS.cell.sunk;
    default: return COLORS.cell.empty;
  }
}

const styles = StyleSheet.create({
  cell: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitMarker: {
    width: '50%',
    height: '50%',
    borderRadius: 100,
    backgroundColor: COLORS.accent.fire,
    opacity: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missMarker: {
    width: '30%',
    height: '30%',
    borderRadius: 100,
    backgroundColor: '#38bdf8',
    opacity: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missMarkerText: {
    color: '#e2e8f0',
    fontSize: 8,
    fontWeight: 'bold',
  },
  sunkMarker: {
    width: '60%',
    height: '60%',
    backgroundColor: COLORS.accent.fireDark,
    opacity: 0.8,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitMarkerText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sunkMarkerText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    transform: [{ rotate: '-45deg' }],
  },
});

export default memo(CellComponent);
