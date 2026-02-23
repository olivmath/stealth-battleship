import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { useHaptics } from '../hooks/useHaptics';
import { getMatchHistory } from '../stats/adapter';
import { MatchRecord } from '../shared/entities';
import { COLORS, FONTS, SPACING, LAYOUT } from '../shared/theme';
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

          {/* ZK Proofs */}
          {match.commitment?.playerZk || match.commitment?.opponentZk ? (
            <div style={styles.zkContainer}>
              <span style={styles.zkTitle}>{t('matchDetail.zkProofs')}</span>

              {match.commitment?.playerZk && (
                <div style={styles.zkSection}>
                  <span style={styles.zkSectionLabel}>{t('matchDetail.zkPlayer')}</span>

                  <div style={styles.zkProofCard}>
                    <div style={styles.zkProofHeader}>
                      <span style={styles.zkProofName}>{t('matchDetail.zkBoardValidity')}</span>
                      <span style={styles.zkStatusBadge}>{t('matchDetail.zkVerified')}</span>
                    </div>
                    <span style={styles.zkProofDesc}>{t('matchDetail.zkBoardValidityDesc')}</span>

                    <div style={styles.zkDetailRow}>
                      <span style={styles.zkDetailLabel}>{t('matchDetail.zkBoardHash')}</span>
                      <span style={styles.zkDetailValue}>
                        {match.commitment.playerZk.boardHash.slice(0, 10)}...{match.commitment.playerZk.boardHash.slice(-6)}
                      </span>
                    </div>
                    <div style={styles.zkDetailRow}>
                      <span style={styles.zkDetailLabel}>{t('matchDetail.zkProofSize')}</span>
                      <span style={styles.zkDetailValue}>
                        {t('matchDetail.zkProofBytes', { size: match.commitment.playerZk.proof?.length ?? 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {match.commitment?.opponentZk && (
                <div style={styles.zkSection}>
                  <span style={styles.zkSectionLabel}>{t('matchDetail.zkOpponent')}</span>

                  <div style={styles.zkProofCard}>
                    <div style={styles.zkProofHeader}>
                      <span style={styles.zkProofName}>{t('matchDetail.zkBoardValidity')}</span>
                      <span style={styles.zkStatusBadge}>{t('matchDetail.zkVerified')}</span>
                    </div>
                    <span style={styles.zkProofDesc}>{t('matchDetail.zkBoardValidityDesc')}</span>

                    <div style={styles.zkDetailRow}>
                      <span style={styles.zkDetailLabel}>{t('matchDetail.zkBoardHash')}</span>
                      <span style={styles.zkDetailValue}>
                        {match.commitment.opponentZk.boardHash.slice(0, 10)}...{match.commitment.opponentZk.boardHash.slice(-6)}
                      </span>
                    </div>
                    <div style={styles.zkDetailRow}>
                      <span style={styles.zkDetailLabel}>{t('matchDetail.zkProofSize')}</span>
                      <span style={styles.zkDetailValue}>
                        {t('matchDetail.zkProofBytes', { size: match.commitment.opponentZk.proof?.length ?? 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.zkContainer}>
              <span style={styles.zkTitle}>{t('matchDetail.zkProofs')}</span>
              <div style={styles.zkNone}>
                <span style={styles.zkNoneTitle}>{t('matchDetail.zkNone')}</span>
                <span style={styles.zkNoneDesc}>{t('matchDetail.zkNoneDesc')}</span>
              </div>
            </div>
          )}

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
  scrollContainer: { flex: 1, overflowY: 'auto', width: '100%' },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl, display: 'flex', flexDirection: 'column', gap: SPACING.lg, maxWidth: LAYOUT.maxContentWidth, width: '100%', margin: '0 auto', boxSizing: 'border-box' as const },
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
  zkContainer: {
    border: '1px solid ' + COLORS.status.pvp + '33',
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: 'rgba(34, 211, 238, 0.03)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.md,
  },
  zkTitle: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.status.pvp,
    letterSpacing: 2,
    textAlign: 'center' as const,
  },
  zkSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.sm,
  },
  zkSectionLabel: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  zkProofCard: {
    border: '1px solid ' + COLORS.surface.cardBorder,
    borderRadius: 4,
    padding: SPACING.sm,
    backgroundColor: COLORS.surface.card,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.xs,
  },
  zkProofHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zkProofName: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  zkStatusBadge: {
    fontFamily: FONTS.heading,
    fontSize: 8,
    color: COLORS.status.online,
    letterSpacing: 1,
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: COLORS.status.online,
    borderRadius: 3,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2,
    paddingBottom: 2,
  },
  zkProofDesc: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.secondary,
    opacity: 0.8,
  },
  zkDetailRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 3,
    paddingBottom: 3,
    borderTop: '1px solid ' + COLORS.surface.cardBorder,
  },
  zkDetailLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  zkDetailValue: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.status.pvp,
    letterSpacing: 0.5,
  },
  zkNone: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  zkNoneTitle: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.text.secondary,
    letterSpacing: 1,
    opacity: 0.6,
  },
  zkNoneDesc: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.secondary,
    opacity: 0.5,
    textAlign: 'center' as const,
  },
};
