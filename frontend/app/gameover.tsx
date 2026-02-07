import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useGame } from '../src/context/GameContext';
import { useHaptics } from '../src/hooks/useHaptics';
import { usePlayerStats } from '../src/hooks/useStorage';
import { getLevelInfo } from '../src/engine/stats';
import { ShipKillEfficiency, LevelInfo } from '../src/types/game';
import { DIFFICULTY_CONFIG } from '../src/constants/game';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

function KillEfficiencyBar({ item }: { item: ShipKillEfficiency }) {
  const maxShots = Math.max(item.actualShots, item.idealShots);
  const idealWidth = maxShots > 0 ? (item.idealShots / maxShots) * 100 : 0;
  const actualWidth = maxShots > 0 ? (item.actualShots / maxShots) * 100 : 0;
  const isPerfect = item.actualShots === item.idealShots;

  return (
    <View style={effStyles.container}>
      <View style={effStyles.header}>
        <Text style={effStyles.shipName}>{item.shipName}</Text>
        <Text style={[effStyles.ratio, isPerfect && effStyles.perfectRatio]}>
          {item.idealShots}/{item.actualShots} {isPerfect ? 'PERFECT' : ''}
        </Text>
      </View>
      <View style={effStyles.barBg}>
        <View style={[effStyles.barActual, { width: `${actualWidth}%` }]} />
        <View style={[effStyles.barIdeal, { width: `${idealWidth}%` }]} />
      </View>
      <View style={effStyles.legend}>
        <View style={effStyles.legendItem}>
          <View style={[effStyles.legendDot, { backgroundColor: COLORS.accent.gold }]} />
          <Text style={effStyles.legendText}>Ideal</Text>
        </View>
        <View style={effStyles.legendItem}>
          <View style={[effStyles.legendDot, { backgroundColor: COLORS.accent.fire }]} />
          <Text style={effStyles.legendText}>Actual</Text>
        </View>
      </View>
    </View>
  );
}

const effStyles = StyleSheet.create({
  container: { gap: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shipName: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.text.primary },
  ratio: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.text.secondary },
  perfectRatio: { color: COLORS.accent.gold },
  barBg: { height: 8, borderRadius: 4, backgroundColor: 'rgba(30, 58, 95, 0.3)', overflow: 'hidden' },
  barActual: { position: 'absolute', height: '100%', borderRadius: 4, backgroundColor: COLORS.accent.fire, opacity: 0.6 },
  barIdeal: { position: 'absolute', height: '100%', borderRadius: 4, backgroundColor: COLORS.accent.gold },
  legend: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontFamily: FONTS.bodyLight, fontSize: 10, color: COLORS.text.secondary },
});

function LevelUpModal({ visible, levelInfo }: { visible: boolean; levelInfo: LevelInfo }) {
  if (!visible) return null;
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={luStyles.backdrop}>
        <View style={luStyles.container}>
          <Text style={luStyles.label}>RANK UP!</Text>
          <Text style={luStyles.rank}>{levelInfo.rank.toUpperCase()}</Text>
          <Text style={luStyles.motto}>{levelInfo.motto}</Text>
        </View>
      </View>
    </Modal>
  );
}

const luStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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

export default function GameOverScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const { stats, refresh } = usePlayerStats();
  const [showReport, setShowReport] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousXP, setPreviousXP] = useState<number | null>(null);

  const isVictory = state.winner === 'player';
  const ms = state.lastMatchStats;
  const xpEarned = ms?.score ?? 0;
  const difficulty = state.settings.difficulty;
  const multiplier = DIFFICULTY_CONFIG[difficulty].scoreMultiplier;

  // Track level-up
  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (previousXP === null && stats.totalXP > 0) {
      // totalXP already includes this match's score (saved in battle.tsx)
      const xpBefore = stats.totalXP - xpEarned;
      setPreviousXP(xpBefore);

      const levelBefore = getLevelInfo(xpBefore);
      const levelAfter = getLevelInfo(stats.totalXP);
      if (levelAfter.rank !== levelBefore.rank) {
        haptics.sunk();
        setTimeout(() => setShowLevelUp(true), 800);
        setTimeout(() => setShowLevelUp(false), 3500);
      }
    }
  }, [stats.totalXP]);

  const currentLevel = getLevelInfo(stats.totalXP);

  const handlePlayAgain = () => {
    haptics.light();
    dispatch({ type: 'RESET_GAME' });
    router.replace('/placement');
  };

  const handleMenu = () => {
    haptics.light();
    router.replace('/menu');
  };

  return (
    <GradientContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.result, isVictory ? styles.victory : styles.defeat]}>
            {isVictory ? 'VICTORY' : 'DEFEAT'}
          </Text>
          <Text style={styles.subtitle}>
            {isVictory ? 'Enemy fleet destroyed' : 'Your fleet has been sunk'}
          </Text>
          <View style={[styles.divider, { backgroundColor: isVictory ? COLORS.accent.gold : COLORS.accent.fire }]} />
        </View>

        {/* Score */}
        {ms && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={[styles.scoreValue, isVictory ? styles.victory : styles.defeat]}>
              {ms.score}
            </Text>
          </View>
        )}

        {/* XP Earned + Level Progress */}
        <View style={styles.xpContainer}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>XP EARNED</Text>
            <View style={styles.xpRight}>
              {multiplier !== 1 && (
                <Text style={styles.multiplierBadge}>{multiplier}x</Text>
              )}
              <Text style={styles.xpValue}>+{xpEarned}</Text>
            </View>
          </View>
          <View style={styles.difficultyRow}>
            <Text style={styles.difficultyLabel}>{difficulty.toUpperCase()}</Text>
          </View>
          <View style={styles.levelRow}>
            <Text style={styles.levelRank}>{currentLevel.rank.toUpperCase()}</Text>
            <Text style={styles.levelXP}>{currentLevel.currentXP} / {currentLevel.xpForNextRank}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.round(currentLevel.progress * 100)}%` }]} />
          </View>
        </View>

        {/* Primary Stats */}
        {ms && (
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{ms.accuracy}%</Text>
                <Text style={styles.statLabel}>ACCURACY</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{ms.shotsFired}</Text>
                <Text style={styles.statLabel}>{isVictory ? 'SHOTS TO WIN' : 'SHOTS FIRED'}</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.shipsRow}>
                  {Array.from({ length: ms.totalShips }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.shipDot,
                        i < ms.shipsSurvived ? styles.shipAlive : styles.shipDead,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.statLabel}>SHIPS SURVIVED</Text>
              </View>
            </View>
          </View>
        )}

        {/* Battle Report (expandable) */}
        {ms && (
          <View style={styles.reportContainer}>
            <TouchableOpacity
              style={styles.reportToggle}
              onPress={() => {
                haptics.light();
                setShowReport(!showReport);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.reportTitle}>BATTLE REPORT</Text>
              <Text style={styles.reportArrow}>{showReport ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showReport && (
              <View style={styles.reportContent}>
                {ms.killEfficiency.length > 0 && (
                  <View style={styles.reportSection}>
                    <Text style={styles.reportSectionTitle}>KILL EFFICIENCY</Text>
                    {ms.killEfficiency.map(item => (
                      <KillEfficiencyBar key={item.shipId} item={item} />
                    ))}
                  </View>
                )}

                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Longest Hit Streak</Text>
                  <Text style={styles.reportValue}>{ms.longestStreak}</Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>First Blood</Text>
                  <Text style={styles.reportValue}>
                    {ms.firstBloodTurn > 0 ? `Turn ${ms.firstBloodTurn}` : '—'}
                  </Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Perfect Kills</Text>
                  <Text style={[styles.reportValue, ms.perfectKills > 0 && styles.perfectText]}>
                    {ms.perfectKills} / {ms.killEfficiency.length}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <NavalButton title="PLAY AGAIN" onPress={handlePlayAgain} />
          <NavalButton title="RETURN TO BASE" onPress={handleMenu} variant="secondary" />
        </View>
      </ScrollView>
      <LevelUpModal visible={showLevelUp} levelInfo={currentLevel} />
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  header: { alignItems: 'center', marginTop: SPACING.xl },
  result: { fontFamily: FONTS.heading, fontSize: 42, letterSpacing: 6 },
  victory: { color: COLORS.accent.gold },
  defeat: { color: COLORS.accent.fire },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.secondary, marginTop: SPACING.sm },
  divider: { width: 80, height: 2, marginTop: SPACING.md, opacity: 0.6 },
  scoreContainer: { alignItems: 'center' },
  scoreLabel: { fontFamily: FONTS.heading, fontSize: 10, color: COLORS.text.secondary, letterSpacing: 3 },
  scoreValue: { fontFamily: FONTS.heading, fontSize: 48, letterSpacing: 2 },
  // XP Section
  xpContainer: {
    borderWidth: 1,
    borderColor: COLORS.accent.gold,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  multiplierBadge: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.background.dark,
    backgroundColor: COLORS.accent.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
    letterSpacing: 1,
  },
  xpLabel: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  xpValue: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: COLORS.accent.gold,
  },
  difficultyRow: {
    marginTop: 4,
  },
  difficultyLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  levelRank: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.accent.gold,
    letterSpacing: 1,
  },
  levelXP: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(30, 58, 95, 0.4)',
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.accent.gold,
  },
  // Stats
  statsContainer: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
  },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: SPACING.xs },
  statValue: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.text.primary },
  statLabel: { fontFamily: FONTS.body, fontSize: 9, color: COLORS.text.secondary, letterSpacing: 1 },
  shipsRow: { flexDirection: 'row', gap: 6 },
  shipDot: { width: 18, height: 18, borderRadius: 2, borderWidth: 1 },
  shipAlive: { backgroundColor: 'rgba(34, 197, 94, 0.3)', borderColor: '#22c55e' },
  shipDead: { backgroundColor: 'rgba(239, 68, 68, 0.3)', borderColor: COLORS.accent.fire },
  // Report
  reportContainer: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
    overflow: 'hidden',
  },
  reportToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  reportTitle: { fontFamily: FONTS.heading, fontSize: 10, color: COLORS.text.secondary, letterSpacing: 2 },
  reportArrow: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.text.secondary },
  reportContent: { padding: SPACING.md, paddingTop: 0, gap: SPACING.md },
  reportSection: { gap: SPACING.sm },
  reportSectionTitle: { fontFamily: FONTS.heading, fontSize: 9, color: COLORS.text.secondary, letterSpacing: 1 },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 58, 95, 0.3)',
  },
  reportLabel: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.text.secondary },
  reportValue: { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.text.primary },
  perfectText: { color: COLORS.accent.gold },
  actions: { gap: SPACING.md },
});
