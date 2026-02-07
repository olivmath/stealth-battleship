import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Orientation } from '../../types/game';
import { COLORS, SPACING } from '../../constants/theme';

interface Props {
  shipSize: number;
  orientation: Orientation;
  onToggle: () => void;
}

function MiniShip({ size, direction }: { size: number; direction: Orientation }) {
  return (
    <View style={direction === 'horizontal' ? miniStyles.row : miniStyles.col}>
      {Array.from({ length: size }).map((_, i) => (
        <View key={i} style={miniStyles.cell} />
      ))}
    </View>
  );
}

const miniStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  col: { flexDirection: 'column', gap: 2 },
  cell: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.accent.gold,
    borderRadius: 2,
  },
});

export default function ShipPreview({ shipSize, orientation, onToggle }: Props) {
  const isH = orientation === 'horizontal';
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.option, isH && styles.optionActive]}
        onPress={isH ? undefined : onToggle}
        activeOpacity={0.7}
        accessibilityRole="radio"
        accessibilityState={{ checked: isH }}
        accessibilityLabel="Horizontal"
      >
        <MiniShip size={shipSize} direction="horizontal" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.option, !isH && styles.optionActive]}
        onPress={isH ? onToggle : undefined}
        activeOpacity={0.7}
        accessibilityRole="radio"
        accessibilityState={{ checked: !isH }}
        accessibilityLabel="Vertical"
      >
        <MiniShip size={shipSize} direction="vertical" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
    alignItems: 'center',
  },
  option: {
    width: 52,
    height: 52,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    backgroundColor: 'rgba(30, 58, 95, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    borderColor: COLORS.accent.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
});
