import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useHaptics } from '../src/hooks/useHaptics';
import { getMatchHistory } from '../src/stats/adapter';
import { MatchRecord } from '../src/shared/entities';
import { COLORS, FONTS, SPACING } from '../src/shared/theme';
import KillEfficiencyBar from '../src/components/Stats/KillEfficiencyBar';

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const haptics = useHaptics();
  const { t } = useTranslation();
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
          <Text style={styles.loading}>{t('matchDetail.loading')}</Text>
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
            {isVictory ? t('matchDetail.victory') : t('matchDetail.defeat')}
          </Text>
          <Text style={styles.date}>{dateStr}</Text>
          <Text style={styles.gridLabel}>
            {match.gridSize}x{match.gridSize} Grid{match.difficulty ? ` • ${t(`difficulty.${match.difficulty}`)}` : ''}
          </Text>
          <View style={[styles.divider, { backgroundColor: isVictory ? COLORS.accent.gold : COLORS.accent.fire }]} />
        </View>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>{t('matchDetail.score')}</Text>
          <Text style={[styles.scoreValue, isVictory ? styles.victory : styles.defeat]}>
            {ms.score}
          </Text>
        </View>

        {/* Primary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{ms.accuracy}%</Text>
              <Text style={styles.statLabel}>{t('matchDetail.accuracy')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{ms.shotsFired}</Text>
              <Text style={styles.statLabel}>{t('matchDetail.shotsFired')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{ms.shipsSurvived}/{ms.totalShips}</Text>
              <Text style={styles.statLabel}>{t('matchDetail.survived')}</Text>
            </View>
          </View>
        </View>

        {/* Battle Report */}
        <View style={styles.reportContainer}>
          <Text style={styles.reportTitle}>{t('matchDetail.battleReport')}</Text>

          {ms.killEfficiency.length > 0 && (
            <View style={styles.reportSection}>
              <Text style={styles.reportSectionTitle}>{t('matchDetail.killEfficiency')}</Text>
              {ms.killEfficiency.map(item => (
                <KillEfficiencyBar key={item.shipId} item={item} showLegend={false} />
              ))}
            </View>
          )}

          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>{t('matchDetail.longestStreak')}</Text>
            <Text style={styles.reportValue}>{ms.longestStreak}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>{t('matchDetail.firstBlood')}</Text>
            <Text style={styles.reportValue}>
              {ms.firstBloodTurn > 0 ? t('matchDetail.turn', { number: ms.firstBloodTurn }) : t('common.dash')}
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>{t('matchDetail.perfectKills')}</Text>
            <Text style={[styles.reportValue, ms.perfectKills > 0 && styles.perfectText]}>
              {ms.perfectKills} / {ms.killEfficiency.length}
            </Text>
          </View>
        </View>

        {/* Back */}
        <NavalButton
          title={t('matchDetail.backToHistory')}
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
