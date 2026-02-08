import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RANKS } from '../../engine/stats';
import { RANK_PROGRESSION } from '../../constants/game';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface Props {
  totalXP: number;
}

export default function RankList({ totalXP }: Props) {
  const { t } = useTranslation();
  // Find index of current rank
  let currentIndex = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalXP >= RANKS[i].xp) {
      currentIndex = i;
      break;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('rankList.title')}</Text>
      {[...RANKS].reverse().map((r, ri) => {
        const i = RANKS.length - 1 - ri;
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;
        const isFuture = i > currentIndex;
        const config = RANK_PROGRESSION.find(p => p.rank === r.rank);

        return (
          <View
            key={r.rank}
            style={[
              styles.row,
              isCurrent && styles.rowCurrent,
              isFuture && styles.rowFuture,
            ]}
          >
            <View style={styles.rowLeft}>
              {isPast && <Text style={styles.check}>{'\u2713'}</Text>}
              {isCurrent && <Text style={styles.currentDot}>{'\u25CF'}</Text>}
              {isFuture && <Text style={styles.futureDot}>{'\u25CB'}</Text>}
              <View style={styles.rankInfo}>
                <Text
                  style={[
                    styles.rankName,
                    isCurrent && styles.rankNameCurrent,
                    isFuture && styles.rankNameFuture,
                  ]}
                >
                  {t('ranks.' + r.rank).toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.motto,
                    isFuture && styles.mottoFuture,
                  ]}
                >
                  {t('mottos.' + r.rank)}
                </Text>
                {config && (
                  <Text style={styles.rankMeta}>
                    {config.gridSize}x{config.gridSize} {'\u2022'} {t('rankList.ships', { count: config.ships.length })}
                  </Text>
                )}
              </View>
            </View>
            <Text
              style={[
                styles.xpThreshold,
                isCurrent && styles.xpCurrent,
                isFuture && styles.xpFuture,
              ]}
            >
              {r.xp.toLocaleString()} XP
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    backgroundColor: COLORS.surface.card,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: 4,
  },
  rowCurrent: {
    borderWidth: 1,
    borderColor: COLORS.accent.gold,
    backgroundColor: COLORS.overlay.goldSoft,
  },
  rowFuture: {
    opacity: 0.45,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  check: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.accent.victory,
    width: 18,
    textAlign: 'center',
  },
  currentDot: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.accent.gold,
    width: 18,
    textAlign: 'center',
  },
  futureDot: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.text.secondary,
    width: 18,
    textAlign: 'center',
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  rankNameCurrent: {
    color: COLORS.accent.gold,
  },
  rankNameFuture: {
    color: COLORS.text.secondary,
  },
  motto: {
    fontFamily: FONTS.bodyLight,
    fontSize: 10,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  mottoFuture: {
    color: COLORS.text.secondary,
  },
  rankMeta: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.text.secondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  xpThreshold: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  xpCurrent: {
    color: COLORS.accent.gold,
  },
  xpFuture: {
    color: COLORS.text.secondary,
  },
});
