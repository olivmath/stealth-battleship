import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface Props {
  isPlayerTurn: boolean;
}

export default function TurnIndicator({ isPlayerTurn }: Props) {
  return (
    <View
      style={[styles.container, !isPlayerTurn && styles.enemyContainer]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={isPlayerTurn ? 'Your turn. Tap a cell to fire.' : 'Enemy is firing. Please wait.'}
    >
      <View style={[styles.dot, { backgroundColor: isPlayerTurn ? COLORS.accent.gold : COLORS.accent.fire }]} />
      <Text style={[styles.text, !isPlayerTurn && styles.enemyText]}>
        {isPlayerTurn ? 'YOUR TURN' : 'ENEMY FIRING...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.accent.gold,
    backgroundColor: COLORS.overlay.goldMedium,
  },
  enemyContainer: {
    borderColor: COLORS.accent.fire,
    backgroundColor: COLORS.overlay.fireGlow,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  text: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.text.accent,
    letterSpacing: 2,
  },
  enemyText: {
    color: COLORS.accent.fire,
  },
});
