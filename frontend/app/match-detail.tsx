import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useHaptics } from '../src/hooks/useHaptics';
import { getMatchHistory } from '../src/storage/scores';
import { MatchRecord } from '../src/types/game';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';
import KillEfficiencyBar from '../src/components/Stats/KillEfficiencyBar';

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const haptics = useHaptics();
  const [match, setMatch] = useState<MatchRecord | null>(null);

  useEffect(() => {
    getMatchHistory().then(history => {
      const found = history.find(m => m.id === params.id);
      setMatch(found ?? null);
    });
  }, [params.id]);

  if (!match) {
    return (
      <GradientContainer>
        <View style={styles.center}>
          <Text style={styles.loading}>Loading...</Text>
        </View>
      </GradientContainer>
    );
  }

  const isVictory = match.result === 'victory';
  const ms = match.stats;
  const dateStr = new Date(match.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <GradientContainer>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.result, isVictory ? styles.victory : styles.defeat]}>
            {isVictory ? 'VICTORY' : 'DEFEAT'}
          </Text>
          <Text style={styles.date}>{dateStr}</Text>
          <Text style={styles.gridLabel}>
            {match.gridSize}x{match.gridSize} Grid{match.difficulty ? ` • ${match.difficulty.toUpperCase()}` : ''}
          </Text>
          <View style={[styles.divider, { backgroundColor: isVictory ? COLORS.accent.gold : COLORS.accent.fire }]} />
        </View>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={[styles.scoreValue, isVictory ? styles.victory : styles.defeat]}>
            {ms.score}
          </Text>
        </View>

        {/* Primary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{ms.accuracy}%</Text>
              <Text style={styles.statLabel}>ACCURACY</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{ms.shotsFired}</Text>
              <Text style={styles.statLabel}>SHOTS FIRED</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{ms.shipsSurvived}/{ms.totalShips}</Text>
              <Text style={styles.statLabel}>SURVIVED</Text>
            </View>
          </View>
        </View>

        {/* Battle Report */}
        <View style={styles.reportContainer}>
          <Text style={styles.reportTitle}>BATTLE REPORT</Text>

          {ms.killEfficiency.length > 0 && (
            <View style={styles.reportSection}>
              <Text style={styles.reportSectionTitle}>KILL EFFICIENCY</Text>
              {ms.killEfficiency.map(item => (
                <KillEfficiencyBar key={item.shipId} item={item} showLegend={false} />
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

        {/* Back */}
        <NavalButton
          title="BACK TO HISTORY"
          onPress={() => {
            haptics.light();
            router.replace('/match-history');
          }}
          variant="secondary"
        />
      </ScrollView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loading: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.text.secondary },
  scrollContainer: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  header: { alignItems: 'center', marginTop: SPACING.xl },
  result: { fontFamily: FONTS.heading, fontSize: 36, letterSpacing: 6 },
  victory: { color: COLORS.accent.gold },
  defeat: { color: COLORS.accent.fire },
  date: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.secondary, marginTop: SPACING.sm },
  gridLabel: { fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  divider: { width: 80, height: 2, marginTop: SPACING.md, opacity: 0.6 },
  scoreContainer: { alignItems: 'center' },
  scoreLabel: { fontFamily: FONTS.heading, fontSize: 10, color: COLORS.text.secondary, letterSpacing: 3 },
  scoreValue: { fontFamily: FONTS.heading, fontSize: 48, letterSpacing: 2 },
  statsContainer: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.surface.card,
  },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: SPACING.xs },
  statValue: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.text.primary },
  statLabel: { fontFamily: FONTS.body, fontSize: 9, color: COLORS.text.secondary, letterSpacing: 1 },
  reportContainer: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.surface.card,
    gap: SPACING.md,
  },
  reportTitle: { fontFamily: FONTS.heading, fontSize: 10, color: COLORS.text.secondary, letterSpacing: 2, textAlign: 'center' },
  reportSection: { gap: SPACING.sm },
  reportSectionTitle: { fontFamily: FONTS.heading, fontSize: 9, color: COLORS.text.secondary, letterSpacing: 1 },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.cardBorder,
  },
  reportLabel: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.text.secondary },
  reportValue: { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.text.primary },
  perfectText: { color: COLORS.accent.gold },
});
