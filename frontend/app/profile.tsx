import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import RankList from '../src/components/Profile/RankList';
import { useGame } from '../src/context/GameContext';
import { usePlayerStats } from '../src/hooks/useStorage';
import { useHaptics } from '../src/hooks/useHaptics';
import { getLevelInfo } from '../src/engine/stats';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

function LevelBadge({ totalXP }: { totalXP: number }) {
  const { t } = useTranslation();
  const level = getLevelInfo(totalXP);

  return (
    <View style={levelStyles.container}>
      <View style={levelStyles.rankRow}>
        <Text style={levelStyles.rankTitle}>{t('ranks.' + level.rank).toUpperCase()}</Text>
        <Text style={levelStyles.xpText}>{level.currentXP} XP</Text>
      </View>
      <Text style={levelStyles.motto}>{t('mottos.' + level.rank)}</Text>
      <View style={levelStyles.progressBg}>
        <View style={[levelStyles.progressFill, { width: `${Math.round(level.progress * 100)}%` }]} />
      </View>
      <View style={levelStyles.progressLabels}>
        <Text style={levelStyles.progressText}>{level.xpForCurrentRank}</Text>
        <Text style={levelStyles.progressText}>{level.xpForNextRank}</Text>
      </View>
    </View>
  );
}

const levelStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: COLORS.accent.gold,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.overlay.goldGlow,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankTitle: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.accent.gold,
    letterSpacing: 2,
  },
  xpText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  motto: {
    fontFamily: FONTS.bodyLight,
    fontSize: 12,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surface.elevated,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.accent.gold,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  progressText: {
    fontFamily: FONTS.bodyLight,
    fontSize: 10,
    color: COLORS.text.secondary,
    opacity: 0.6,
  },
});

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { state } = useGame();
  const { stats, refresh } = usePlayerStats();
  const haptics = useHaptics();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const winRate = stats.wins + stats.losses > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

  const accuracy = stats.totalShots > 0
    ? Math.round((stats.totalHits / stats.totalShots) * 100)
    : 0;

  return (
    <GradientContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <Text style={styles.name}>{state.playerName}</Text>
          <View style={styles.divider} />
        </View>

        <LevelBadge totalXP={stats.totalXP} />

        {/* Combat Record */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>{t('profile.combatRecord')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.wins}</Text>
              <Text style={styles.statLabel}>{t('profile.victories')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.losses}</Text>
              <Text style={styles.statLabel}>{t('profile.defeats')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{winRate}%</Text>
              <Text style={styles.statLabel}>{t('profile.winRate')}</Text>
            </View>
          </View>
        </View>

        {/* Accuracy & Shots */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>{t('profile.firingRecord')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{accuracy}%</Text>
              <Text style={styles.statLabel}>{t('profile.accuracy')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalShots}</Text>
              <Text style={styles.statLabel}>{t('profile.totalShots')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalHits}</Text>
              <Text style={styles.statLabel}>{t('profile.totalHits')}</Text>
            </View>
          </View>
        </View>

        <RankList totalXP={stats.totalXP} />

        <NavalButton
          title={t('profile.backToBase')}
          onPress={() => {
            haptics.light();
            router.back();
          }}
          variant="secondary"
        />
      </ScrollView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  scrollContent: {
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.text.secondary,
    letterSpacing: 3,
  },
  name: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: COLORS.text.accent,
    letterSpacing: 2,
    marginTop: SPACING.xs,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.accent.gold,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  statsContainer: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.surface.card,
  },
  statsTitle: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: COLORS.text.primary,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginTop: SPACING.xs,
  },
});
