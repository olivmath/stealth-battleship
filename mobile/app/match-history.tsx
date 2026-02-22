import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import { useMatchHistory } from '../src/stats/translator';
import { useHaptics } from '../src/hooks/useHaptics';
import { MatchRecord } from '../src/shared/entities';
import { COLORS, FONTS, SPACING } from '../src/shared/theme';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: COLORS.status.online,
  normal: COLORS.accent.gold,
  hard: COLORS.accent.fire,
};

function MatchHistoryItem({ match, onPress }: { match: MatchRecord; onPress: () => void }) {
  const { t } = useTranslation();
  const isVictory = match.result === 'victory';
  const dateStr = new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const difficulty = match.difficulty ?? 'normal';
  const diffColor = DIFFICULTY_COLORS[difficulty] ?? COLORS.text.secondary;

  return (
    <TouchableOpacity
      style={itemStyles.item}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${isVictory ? 'Victory' : 'Defeat'}, ${dateStr}, ${match.gridSize}x${match.gridSize}, ${difficulty}, score ${match.score}`}
    >
      <View style={itemStyles.left}>
        <Text style={[itemStyles.result, isVictory ? itemStyles.win : itemStyles.loss]}>
          {isVictory ? t('matchHistory.win') : t('matchHistory.loss')}
        </Text>
        <View>
          <Text style={itemStyles.date}>{dateStr}</Text>
          <View style={itemStyles.infoRow}>
            <Text style={itemStyles.grid}>{match.gridSize}x{match.gridSize}</Text>
            <View style={[itemStyles.diffBadge, { borderColor: diffColor }]}>
              <Text style={[itemStyles.diffText, { color: diffColor }]}>
                {difficulty.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={[itemStyles.score, isVictory ? itemStyles.win : itemStyles.loss]}>
        {match.score}
      </Text>
    </TouchableOpacity>
  );
}

const itemStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.cardBorder,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  result: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  win: {
    color: COLORS.accent.gold,
  },
  loss: {
    color: COLORS.accent.fire,
  },
  date: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  grid: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  diffBadge: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  diffText: {
    fontFamily: FONTS.heading,
    fontSize: 8,
    letterSpacing: 1,
  },
  score: {
    fontFamily: FONTS.heading,
    fontSize: 18,
  },
});

export default function MatchHistoryScreen() {
  const router = useRouter();
  const { history, loading } = useMatchHistory();
  const haptics = useHaptics();
  const { t } = useTranslation();

  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('matchHistory.title')}</Text>
          <View style={styles.divider} />
        </View>

        {loading ? (
          <View style={styles.empty}>
            <RadarSpinner size={40} />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('matchHistory.empty')}</Text>
            <Text style={styles.emptySubtext}>{t('matchHistory.emptyDesc')}</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={item => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <MatchHistoryItem
                match={item}
                onPress={() => {
                  haptics.light();
                  router.push({ pathname: '/match-detail', params: { id: item.id } });
                }}
              />
            )}
          />
        )}

        <NavalButton
          title={t('matchHistory.backToBase')}
          onPress={() => {
            haptics.light();
            router.back();
          }}
          variant="secondary"
          style={{ marginTop: 'auto' }}
        />
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.text.accent,
    letterSpacing: 4,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.accent.gold,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  list: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    backgroundColor: COLORS.surface.card,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  emptySubtext: {
    fontFamily: FONTS.bodyLight,
    fontSize: 13,
    color: COLORS.text.secondary,
    opacity: 0.6,
  },
});
