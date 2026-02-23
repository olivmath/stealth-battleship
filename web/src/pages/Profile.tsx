import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { RankList } from '../components/Profile/RankList';
import { useGame } from '../game/translator';
import { usePlayerStats } from '../stats/translator';
import { useHaptics } from '../hooks/useHaptics';
import { getLevelInfo } from '../stats/interactor';
import { COLORS, FONTS, SPACING, LAYOUT } from '../shared/theme';

function LevelBadge({ totalXP }: { totalXP: number }) {
  const { t } = useTranslation();
  const level = getLevelInfo(totalXP);

  return (
    <div style={levelStyles.container}>
      <div style={levelStyles.rankRow}>
        <span style={levelStyles.rankTitle}>{t('ranks.' + level.rank).toUpperCase()}</span>
        <span style={levelStyles.xpText}>{level.currentXP} XP</span>
      </div>
      <span style={levelStyles.motto}>{t('mottos.' + level.rank)}</span>
      <div style={levelStyles.progressBg}>
        <div style={{ ...levelStyles.progressFill, width: `${Math.round(level.progress * 100)}%` }} />
      </div>
      <div style={levelStyles.progressLabels}>
        <span style={levelStyles.progressText}>{level.xpForCurrentRank}</span>
        <span style={levelStyles.progressText}>{level.xpForNextRank}</span>
      </div>
    </div>
  );
}

const levelStyles: Record<string, React.CSSProperties> = {
  container: {
    border: `1px solid ${COLORS.accent.gold}`,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.overlay.goldGlow,
  },
  rankRow: {
    display: 'flex',
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
    display: 'flex',
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
};

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      <div style={styles.scrollContainer}>
        <div style={styles.scrollContent}>
          <div style={styles.header}>
            <span style={styles.title}>{t('profile.title')}</span>
            <span style={styles.name}>{state.playerName}</span>
            <div style={styles.divider} />
          </div>

          <LevelBadge totalXP={stats.totalXP} />

          {/* Combat Record */}
          <div style={styles.statsContainer}>
            <span style={styles.statsTitle}>{t('profile.combatRecord')}</span>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{stats.wins}</span>
                <span style={styles.statLabel}>{t('profile.victories')}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{stats.losses}</span>
                <span style={styles.statLabel}>{t('profile.defeats')}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{winRate}%</span>
                <span style={styles.statLabel}>{t('profile.winRate')}</span>
              </div>
            </div>
          </div>

          {/* Accuracy & Shots */}
          <div style={styles.statsContainer}>
            <span style={styles.statsTitle}>{t('profile.firingRecord')}</span>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{accuracy}%</span>
                <span style={styles.statLabel}>{t('profile.accuracy')}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{stats.totalShots}</span>
                <span style={styles.statLabel}>{t('profile.totalShots')}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{stats.totalHits}</span>
                <span style={styles.statLabel}>{t('profile.totalHits')}</span>
              </div>
            </div>
          </div>

          <RankList totalXP={stats.totalXP} />

          <NavalButton
            title={t('profile.backToBase')}
            onPress={() => {
              haptics.light();
              navigate(-1);
            }}
            variant="secondary"
          />
        </div>
      </div>
    </GradientContainer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scrollContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: SPACING.lg,
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  scrollContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
    maxWidth: LAYOUT.maxContentWidth,
    width: '100%',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
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
    border: `1px solid ${COLORS.grid.border}`,
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
    display: 'block',
  },
  statsGrid: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
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
};
