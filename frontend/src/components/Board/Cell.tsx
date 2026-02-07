import React, { memo } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { CellState } from '../../types/game';
import { COLORS } from '../../constants/theme';

interface Props {
  state: CellState;
  size: number;
  onPress?: () => void;
  disabled?: boolean;
  isPreview?: boolean;
}

function CellComponent({ state, size, onPress, disabled, isPreview }: Props) {
  const bgColor = isPreview
    ? 'rgba(245, 158, 11, 0.3)'
    : getCellColor(state);

  const borderColor = isPreview
    ? COLORS.accent.gold
    : state === 'hit'
      ? COLORS.accent.fire
      : state === 'sunk'
        ? COLORS.accent.fireDark
        : COLORS.grid.border;

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
    >
      {state === 'hit' && <View style={styles.hitMarker} />}
      {state === 'miss' && <View style={styles.missMarker} />}
      {state === 'sunk' && <View style={styles.sunkMarker} />}
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
  },
  missMarker: {
    width: '30%',
    height: '30%',
    borderRadius: 100,
    backgroundColor: COLORS.text.secondary,
    opacity: 0.5,
  },
  sunkMarker: {
    width: '60%',
    height: '60%',
    backgroundColor: COLORS.accent.fireDark,
    opacity: 0.8,
    transform: [{ rotate: '45deg' }],
  },
});

export default memo(CellComponent);
