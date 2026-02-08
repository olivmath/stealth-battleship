import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { LevelInfo } from '../../types/game';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface Props {
  visible: boolean;
  levelInfo: LevelInfo;
  previousLevelInfo?: LevelInfo;
}

export default function LevelUpModal({ visible, levelInfo, previousLevelInfo }: Props) {
  if (!visible) return null;

  const gridChanged = previousLevelInfo && previousLevelInfo.gridSize !== levelInfo.gridSize;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.label}>RANK UP!</Text>
          <Text style={styles.rank}>{levelInfo.rank.toUpperCase()}</Text>
          <Text style={styles.motto}>{levelInfo.motto}</Text>
          {gridChanged && (
            <Text style={styles.unlock}>NEW GRID: {levelInfo.gridSize}x{levelInfo.gridSize}</Text>
          )}
          <View style={styles.fleetList}>
            <Text style={styles.fleetTitle}>YOUR FLEET</Text>
            {levelInfo.ships.map((s, i) => (
              <Text key={`${s.id}-${i}`} style={styles.fleetItem}>
                {s.name} ({s.size})
              </Text>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.accent.gold,
    borderRadius: 8,
    padding: SPACING.xl,
    backgroundColor: COLORS.background.dark,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.accent.gold,
    letterSpacing: 4,
  },
  rank: {
    fontFamily: FONTS.heading,
    fontSize: 32,
    color: COLORS.accent.gold,
    letterSpacing: 3,
  },
  motto: {
    fontFamily: FONTS.bodyLight,
    fontSize: 14,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  unlock: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.accent.victory,
    letterSpacing: 2,
    marginTop: SPACING.xs,
  },
  fleetList: {
    alignItems: 'center',
    gap: 2,
    marginTop: SPACING.sm,
  },
  fleetTitle: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  fleetItem: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.text.primary,
  },
});
