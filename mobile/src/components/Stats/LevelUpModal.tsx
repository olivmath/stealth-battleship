import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LevelInfo } from '../../shared/entities';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../shared/theme';

interface Props {
  visible: boolean;
  levelInfo: LevelInfo;
  previousLevelInfo?: LevelInfo;
  onDismiss?: () => void;
}

export default function LevelUpModal({ visible, levelInfo, previousLevelInfo, onDismiss }: Props) {
  const { t } = useTranslation();

  if (!visible) return null;

  const gridChanged = previousLevelInfo && previousLevelInfo.gridSize !== levelInfo.gridSize;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.container}>
          <Text style={styles.label}>{t('levelUp.title')}</Text>
          <Text style={styles.rank}>{t('ranks.' + levelInfo.rank).toUpperCase()}</Text>
          <Text style={styles.motto}>{t('mottos.' + levelInfo.rank)}</Text>
          {gridChanged && (
            <Text style={styles.unlock}>{t('levelUp.newGrid', { gridSize: levelInfo.gridSize })}</Text>
          )}
          <View style={styles.fleetList}>
            <Text style={styles.fleetTitle}>{t('levelUp.yourFleet')}</Text>
            {levelInfo.ships.map((s, i) => (
              <Text key={`${s.id}-${i}`} style={styles.fleetItem}>
                {t('ships.' + s.name)} ({s.size})
              </Text>
            ))}
          </View>
        </View>
      </Pressable>
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
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    backgroundColor: COLORS.background.dark,
    ...SHADOWS.lg,
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
