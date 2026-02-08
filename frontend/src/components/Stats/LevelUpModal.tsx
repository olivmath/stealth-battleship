import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { LevelInfo } from '../../types/game';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface Props {
  visible: boolean;
  levelInfo: LevelInfo;
}

export default function LevelUpModal({ visible, levelInfo }: Props) {
  if (!visible) return null;
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.label}>RANK UP!</Text>
          <Text style={styles.rank}>{levelInfo.rank.toUpperCase()}</Text>
          <Text style={styles.motto}>{levelInfo.motto}</Text>
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
});
