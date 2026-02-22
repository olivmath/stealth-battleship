import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { useMatchHistory } from '../stats/translator';
import { useHaptics } from '../hooks/useHaptics';
import { MatchRecord } from '../shared/entities';
import { COLORS, FONTS, SPACING } from '../shared/theme';

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
    <button
      style={itemStyles.item}
      onClick={onPress}
      aria-label={`${isVictory ? 'Victory' : 'Defeat'}, ${dateStr}, ${match.gridSize}x${match.gridSize}, ${difficulty}, score ${match.score}`}
    >
      <div style={itemStyles.left}>
        <span style={{ ...itemStyles.result, ...(isVictory ? itemStyles.win : itemStyles.loss) }}>
          {isVictory ? t('matchHistory.win') : t('matchHistory.loss')}
        </span>
        <div>
          <span style={itemStyles.date}>{dateStr}</span>
          <div style={itemStyles.infoRow}>
            <span style={itemStyles.grid}>{match.gridSize}x{match.gridSize}</span>
            <span style={{ ...itemStyles.diffBadge, borderColor: diffColor }}>
              <span style={{ ...itemStyles.diffText, color: diffColor }}>
                {difficulty.toUpperCase()}
              </span>
            </span>
          </div>
        </div>
      </div>
      <span style={{ ...itemStyles.score, ...(isVictory ? itemStyles.win : itemStyles.loss) }}>
        {match.score}
      </span>
    </button>
  );
}

const itemStyles: Record<string, React.CSSProperties> = {
  item: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.md,
    borderBottom: `1px solid ${COLORS.surface.cardBorder}`,
    background: 'none',
    border: 'none',
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.cardBorder,
    cursor: 'pointer',
    width: '100%',
  },
  left: {
    display: 'flex',
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
    display: 'block',
  },
  infoRow: {
    display: 'flex',
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
    borderStyle: 'solid',
    borderRadius: 3,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 1,
    paddingBottom: 1,
    display: 'inline-block',
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
};

export default function MatchHistory() {
  const navigate = useNavigate();
  const { history, loading } = useMatchHistory();
  const haptics = useHaptics();
  const { t } = useTranslation();

  return (
    <GradientContainer>
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>{t('matchHistory.title')}</span>
          <div style={styles.divider} />
        </div>

        {loading ? (
          <div style={styles.empty}>
            <RadarSpinner size={40} />
          </div>
        ) : history.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyText}>{t('matchHistory.empty')}</span>
            <span style={styles.emptySubtext}>{t('matchHistory.emptyDesc')}</span>
          </div>
        ) : (
          <div style={styles.list}>
            {history.map(item => (
              <MatchHistoryItem
                key={item.id}
                match={item}
                onPress={() => {
                  haptics.light();
                  navigate(`/match-detail?id=${item.id}`);
                }}
              />
            ))}
          </div>
        )}

        <NavalButton
          title={t('matchHistory.backToBase')}
          onPress={() => {
            haptics.light();
            navigate(-1);
          }}
          variant="secondary"
          style={{ marginTop: 'auto' }}
        />
      </div>
    </GradientContainer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
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
    overflowY: 'auto',
    border: `1px solid ${COLORS.grid.border}`,
    borderRadius: 4,
    backgroundColor: COLORS.surface.card,
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
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
};
