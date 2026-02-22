import React, { memo, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { CellState } from '../../shared/entities';
import { COLORS, FONTS } from '../../shared/theme';

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
  isLastAttack?: boolean;
}

function getCellLabel(row: number | undefined, col: number | undefined, state: CellState): string {
  if (row == null || col == null) return state;
  const letter = String.fromCharCode(65 + row);
  const num = col + 1;
  return `${letter}${num}, ${state}`;
}

function CellComponent({ state, size, onPress, disabled, isPreview, isInvalid, row, col, isOpponent, shipColor, isLastAttack }: Props) {
  const flashScale = useSharedValue(1);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    if (isLastAttack) {
      flashScale.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      flashOpacity.value = withSequence(
        withTiming(0.6, { duration: 100 }),
        withTiming(0, { duration: 200 })
      );
    }
  }, [isLastAttack]);

  const flashStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flashScale.value }],
  }));

  const flashOverlayStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const baseBgColor = shipColor && state === 'ship'
    ? shipColor
    : shipColor && state === 'sunk'
      ? `${shipColor}33`
      : getCellColor(state);

  const bgColor = isInvalid
    ? COLORS.overlay.fireHit
    : isPreview
      ? COLORS.overlay.goldPreview
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
    <Animated.View style={flashStyle}>
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
        {/* Flash overlay for enemy attacks */}
        <Animated.View
          style={[styles.flashOverlay, flashOverlayStyle]}
          pointerEvents="none"
        />
      </TouchableOpacity>
    </Animated.View>
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
    backgroundColor: COLORS.marker.miss,
    opacity: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missMarkerText: {
    color: COLORS.marker.hitDot,
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
    color: COLORS.marker.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  sunkMarkerText: {
    color: COLORS.marker.white,
    fontSize: 10,
    fontWeight: 'bold',
    transform: [{ rotate: '-45deg' }],
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
});

export default memo(CellComponent);
