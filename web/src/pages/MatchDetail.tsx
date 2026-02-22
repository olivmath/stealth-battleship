import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'node_modules/react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { useHaptics } from '../hooks/useHaptics';
import { getMatchHistory } from '../stats/adapter';
import { MatchRecord } from '../shared/entities';
import { COLORS, FONTS, SPACING } from '../shared/theme';
import { KillEfficiencyBar } from '../components/Stats/KillEfficiencyBar';

export default function MatchDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const haptics = useHaptics();
  const { t } = useTranslation();
  const [match, setMatch] = useState<MatchRecord | null>(null);

  useEffect(() => {
    getMatchHistory().then(history => {
      const found = history.find(m => m.id === id);
      setMatch(found ?? null);
    });
  }, [id]);

  if (!match) {
    return (
      <GradientContainer>
        <div style={styles.center}>
          <span style={styles.loading}>{t('matchDetail.loading')}</span>
        </div>
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
      <div style={styles.scrollContainer}>
        <div style={styles.content}>
          {/* Header */}
          <div style={styles.header}>
            <span style={{ ...styles.result, ...(isVictory ? styles.victory : styles.defeat) }}>
              {isVictory ? t('matchDetail.victory') : t('matchDetail.defeat')}
            </span>
            <span style={styles.date}>{dateStr}</span>
            <span style={styles.gridLabel}>
              {match.gridSize}x{match.gridSize} Grid{match.difficulty ? ` \u2022 ${t(`difficulty.${match.difficulty}`)}` : ''}
            </span>
            <div style={{ ...styles.divider, backgroundColor: isVictory ? COLORS.accent.gold : COLORS.accent.fire }} />
          </div>

          {/* Score */}
          <div style={styles.scoreContainer}>
            <span style={styles.scoreLabel}>{t('matchDetail.score')}</span>
            <span style={{ ...styles.scoreValue, ...(isVictory ? styles.victory : styles.defeat) }}>
              {ms.score}
            </span>
          </div>

          {/* Primary Stats */}
          <div style={styles.statsContainer}>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{ms.accuracy}%</span>
                <span style={styles.statLabel}>{t('matchDetail.accuracy')}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{ms.shotsFired}</span>
                <span style={styles.statLabel}>{t('matchDetail.shotsFired')}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{ms.shipsSurvived}/{ms.totalShips}</span>
                <span style={styles.statLabel}>{t('matchDetail.survived')}</span>
              </div>
            </div>
          </div>

          {/* Battle Report */}
          <div style={styles.reportContainer}>
            <span style={styles.reportTitle}>{t('matchDetail.battleReport')}</span>

            {ms.killEfficiency.length > 0 && (
              <div style={styles.reportSection}>
                <span style={styles.reportSectionTitle}>{t('matchDetail.killEfficiency')}</span>
                {ms.killEfficiency.map(item => (
                  <KillEfficiencyBar key={item.shipId} item={item} showLegend={false} />
                ))}
              </div>
            )}

            <div style={styles.reportRow}>
              <span style={styles.reportLabel}>{t('matchDetail.longestStreak')}</span>
              <span style={styles.reportValue}>{ms.longestStreak}</span>
            </div>
            <div style={styles.reportRow}>
              <span style={styles.reportLabel}>{t('matchDetail.firstBlood')}</span>
              <span style={styles.reportValue}>
                {ms.firstBloodTurn > 0 ? t('matchDetail.turn', { number: ms.firstBloodTurn }) : t('common.dash')}
              </span>
            </div>
            <div style={styles.reportRow}>
              <span style={styles.reportLabel}>{t('matchDetail.perfectKills')}</span>
              <span style={{ ...styles.reportValue, ...(ms.perfectKills > 0 ? styles.perfectText : {}) }}>
                {ms.perfectKills} / {ms.killEfficiency.length}
              </span>
            </div>
          </div>

          {/* Back */}
          <NavalButton
            title={t('matchDetail.backToHistory')}
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
  center: { display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' },
  loading: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.text.secondary },
  scrollContainer: { flex: 1, overflowY: 'auto' },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl, display: 'flex', flexDirection: 'column', gap: SPACING.lg },
  header: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: SPACING.xl },
  result: { fontFamily: FONTS.heading, fontSize: 36, letterSpacing: 6 },
  victory: { color: COLORS.accent.gold },
  defeat: { color: COLORS.accent.fire },
  date: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.text.secondary, marginTop: SPACING.sm },
  gridLabel: { fontFamily: FONTS.bodyLight, fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  divider: { width: 80, height: 2, marginTop: SPACING.md, opacity: 0.6 },
  scoreContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreLabel: { fontFamily: FONTS.heading, fontSize: 10, color: COLORS.text.secondary, letterSpacing: 3 },
  scoreValue: { fontFamily: FONTS.heading, fontSize: 48, letterSpacing: 2 },
  statsContainer: {
    border: `1px solid ${COLORS.grid.border}`,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.surface.card,
  },
  statsGrid: { display: 'flex', flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING.xs },
  statValue: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.text.primary },
  statLabel: { fontFamily: FONTS.body, fontSize: 9, color: COLORS.text.secondary, letterSpacing: 1 },
  reportContainer: {
    border: `1px solid ${COLORS.grid.border}`,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.surface.card,
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.md,
  },
  reportTitle: { fontFamily: FONTS.heading, fontSize: 10, color: COLORS.text.secondary, letterSpacing: 2, textAlign: 'center' },
  reportSection: { display: 'flex', flexDirection: 'column', gap: SPACING.sm },
  reportSectionTitle: { fontFamily: FONTS.heading, fontSize: 9, color: COLORS.text.secondary, letterSpacing: 1 },
  reportRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
    borderBottom: `1px solid ${COLORS.surface.cardBorder}`,
  },
  reportLabel: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.text.secondary },
  reportValue: { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.text.primary },
  perfectText: { color: COLORS.accent.gold },
};
