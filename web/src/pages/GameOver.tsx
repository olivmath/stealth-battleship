import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { NavalText } from '../components/UI/NavalText';
import { Card } from '../components/UI/Card';
import { Divider } from '../components/UI/Divider';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { GameBoard } from '../components/Board/GameBoard';
import { KillEfficiencyBar } from '../components/Stats/KillEfficiencyBar';
import { LevelUpModal } from '../components/Stats/LevelUpModal';
import { useGame, waitForTurnsProof } from '../game/translator';
import { useHaptics } from '../hooks/useHaptics';
import { usePlayerStats } from '../stats/translator';
import { useResponsive } from '../hooks/useResponsive';
import { getLevelInfo } from '../stats/interactor';
import { DIFFICULTY_CONFIG } from '../shared/constants';
import { MOCK_OPPONENT } from '../services/pvpMock';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, FONT_SIZES } from '../shared/theme';

// Simple animated counter for web
function AnimatedCounter({ to, suffix = '', style, delay = 0 }: { to: number; suffix?: string; style: React.CSSProperties; delay?: number }) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const duration = 800;
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        setValue(Math.round(progress * to));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay);
    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [to, delay]);

  return <span style={style}>{value}{suffix}</span>;
}

export default function GameOver() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const { t } = useTranslation();
  const isPvP = mode === 'pvp';
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const { stats, refresh } = usePlayerStats();
  const [showReport, setShowReport] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousXP, setPreviousXP] = useState<number | null>(null);
  const [waitingProof, setWaitingProof] = useState(false);

  const { width: screenWidth, isMobile, isDesktop } = useResponsive();
  const BOARD_MAX = Math.floor((Math.min(screenWidth, isDesktop ? 800 : 600) - SPACING.lg * 2 - SPACING.sm) / 2);
  const isVictory = state.winner === 'player';
  const ms = state.lastMatchStats;
  const xpEarned = ms?.score ?? 0;
  const difficulty = state.settings.difficulty;
  const multiplier = DIFFICULTY_CONFIG[difficulty].scoreMultiplier;
  const gridSize = state.settings.gridSize;

  const [prevLevel, setPrevLevel] = useState<ReturnType<typeof getLevelInfo> | null>(null);

  // Confetti on victory
  useEffect(() => {
    if (isVictory) {
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    }
  }, [isVictory]);

  // Track level-up
  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (previousXP === null && stats.totalXP >= 0) {
      const xpBefore = Math.max(0, stats.totalXP - xpEarned);
      setPreviousXP(xpBefore);

      const levelBefore = getLevelInfo(xpBefore);
      const levelAfter = getLevelInfo(stats.totalXP);
      if (levelAfter.rank !== levelBefore.rank) {
        setPrevLevel(levelBefore);
        haptics.sunk();
        setTimeout(() => setShowLevelUp(true), 800);
        setTimeout(() => setShowLevelUp(false), 3500);
      }
    }
  }, [stats.totalXP]);

  const currentLevel = getLevelInfo(stats.totalXP);

  const awaitProofThenNavigate = async (nav: () => void) => {
    setWaitingProof(true);
    await waitForTurnsProof();
    setWaitingProof(false);
    nav();
  };

  const handlePlayAgain = () => {
    haptics.light();
    awaitProofThenNavigate(() => {
      if (currentLevel.gridSize !== state.settings.gridSize) {
        const updated = { ...state.settings, gridSize: currentLevel.gridSize };
        dispatch({ type: 'LOAD_SETTINGS', settings: updated });
        import('../settings/interactor').then(m => m.saveSettings(updated));
      }
      dispatch({ type: 'RESET_GAME' });
      navigate(isPvP ? '/placement?mode=pvp' : '/placement', { replace: true });
    });
  };

  const handleMenu = () => {
    haptics.light();
    awaitProofThenNavigate(() => {
      navigate('/menu', { replace: true });
    });
  };

  const subtitle = isPvP
    ? isVictory ? t('gameover.pvpVictoryMsg', { opponent: MOCK_OPPONENT }) : t('gameover.pvpDefeatMsg', { opponent: MOCK_OPPONENT })
    : isVictory ? t('gameover.victoryMsg') : t('gameover.defeatMsg');

  return (
    <GradientContainer>
      <div style={styles.scrollContainer}>
        <div style={styles.content}>
          {/* Header */}
          <div style={styles.header}>
            <NavalText variant="h1" color={isVictory ? COLORS.accent.victory : COLORS.accent.fire} letterSpacing={6} style={{ fontSize: FONT_SIZES.hero }}>
              {isVictory ? t('gameover.victory') : t('gameover.defeat')}
            </NavalText>
            <NavalText variant="body" color={COLORS.text.secondary} style={{ marginTop: SPACING.sm }}>{subtitle}</NavalText>
            <Divider width={80} color={isVictory ? COLORS.accent.gold : COLORS.accent.fire} style={{ marginTop: SPACING.md }} />
          </div>

          {/* Score */}
          {ms && (
            <div style={styles.scoreContainer}>
              <NavalText variant="label" letterSpacing={3}>{t('gameover.score')}</NavalText>
              <AnimatedCounter
                to={ms.score}
                style={{ ...styles.scoreValue, color: isVictory ? COLORS.accent.victory : COLORS.accent.fire }}
                delay={200}
              />
            </div>
          )}

          {/* XP Earned + Level Progress */}
          <div style={{ ...styles.xpContainer, ...(!isVictory ? styles.xpContainerDefeat : {}) }}>
            <div style={styles.xpRow}>
              <span style={styles.xpLabel}>{t('gameover.xpEarned')}</span>
              <div style={styles.xpRight}>
                {!isPvP && multiplier !== 1 && (
                  <span style={styles.multiplierBadge}>{multiplier}x</span>
                )}
                <span style={{ ...styles.xpValue, ...(xpEarned < 0 ? styles.xpNegative : {}) }}>
                  {xpEarned > 0 ? `+${xpEarned}` : `${xpEarned}`}
                </span>
              </div>
            </div>
            <div style={styles.modeRow}>
              <span style={styles.modeLabel}>
                {isPvP ? t('common.pvpOnline') : t('difficulty.' + difficulty)}
              </span>
            </div>
            <div style={styles.levelRow}>
              <span style={styles.levelRank}>{t('ranks.' + currentLevel.rank).toUpperCase()}</span>
              <span style={styles.levelXP}>{currentLevel.currentXP} / {currentLevel.xpForNextRank}</span>
            </div>
            <div style={styles.progressBg}>
              <div style={{ ...styles.progressFill, width: `${Math.round(currentLevel.progress * 100)}%` }} />
            </div>
          </div>

          {/* Primary Stats */}
          {ms && (
            <Card>
              <div style={styles.statsGrid}>
                <div style={styles.statItem}>
                  <AnimatedCounter to={ms.accuracy} suffix="%" style={styles.statValue} delay={400} />
                  <span style={styles.statLabel}>{t('gameover.accuracy')}</span>
                </div>
                <div style={styles.statItem}>
                  <AnimatedCounter to={ms.shotsFired} style={styles.statValue} delay={600} />
                  <span style={styles.statLabel}>{isVictory ? t('gameover.shotsToWin') : t('gameover.shotsFired')}</span>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.shipsRow}>
                    {Array.from({ length: ms.totalShips }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          ...styles.shipDot,
                          ...(i < ms.shipsSurvived ? styles.shipAlive : styles.shipDead),
                        }}
                      />
                    ))}
                  </div>
                  <span style={styles.statLabel}>{t('gameover.shipsSurvived')}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Battle Report */}
          {ms && (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <button
                style={styles.reportToggle}
                onClick={() => {
                  haptics.light();
                  setShowReport(!showReport);
                }}
              >
                <span style={styles.reportTitle}>{t('gameover.battleReport')}</span>
                <span style={styles.reportArrow}>{showReport ? '\u25B2' : '\u25BC'}</span>
              </button>

              {showReport && (
                <div style={styles.reportContent}>
                  {ms.killEfficiency.length > 0 && (
                    <div style={styles.reportSection}>
                      <span style={styles.reportSectionTitle}>{t('gameover.killEfficiency')}</span>
                      {ms.killEfficiency.map(item => (
                        <KillEfficiencyBar key={item.shipId} item={item} />
                      ))}
                    </div>
                  )}

                  <div style={styles.reportRow}>
                    <span style={styles.reportLabel}>{t('gameover.longestStreak')}</span>
                    <span style={styles.reportValue}>{ms.longestStreak}</span>
                  </div>
                  <div style={styles.reportRow}>
                    <span style={styles.reportLabel}>{t('gameover.firstBlood')}</span>
                    <span style={styles.reportValue}>
                      {ms.firstBloodTurn > 0 ? t('gameover.turn', { number: ms.firstBloodTurn }) : t('common.dash')}
                    </span>
                  </div>
                  <div style={styles.reportRow}>
                    <span style={styles.reportLabel}>{t('gameover.perfectKills')}</span>
                    <span style={{ ...styles.reportValue, ...(ms.perfectKills > 0 ? styles.perfectText : {}) }}>
                      {ms.perfectKills} / {ms.killEfficiency.length}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Board Reveal (PvP only) */}
          {isPvP && (
            <div style={styles.boardRevealSection}>
              <span style={styles.revealTitle}>{t('gameover.boardReveal')}</span>
              <div style={styles.boardsRow}>
                <div style={styles.boardColumn}>
                  <span style={styles.boardLabel}>{t('gameover.yourBoard')}</span>
                  <GameBoard
                    board={state.playerBoard}
                    showShips
                    disabled
                    gridSize={gridSize}
                    maxWidth={BOARD_MAX}
                    variant="mini"
                  />
                </div>
                <div style={styles.boardColumn}>
                  <span style={styles.boardLabel}>{t('gameover.opponentBoard')}</span>
                  <GameBoard
                    board={state.opponentBoard}
                    showShips
                    disabled
                    gridSize={gridSize}
                    maxWidth={BOARD_MAX}
                    variant="mini"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={styles.actions}>
            <NavalButton title={isPvP ? t('gameover.rematch') : t('gameover.playAgain')} onPress={handlePlayAgain} />
            <NavalButton title={t('gameover.returnToBase')} onPress={handleMenu} variant="secondary" />
          </div>
        </div>
      </div>
      <LevelUpModal visible={showLevelUp} levelInfo={currentLevel} previousLevelInfo={prevLevel ?? undefined} onDismiss={() => setShowLevelUp(false)} />
      {waitingProof && (
        <div style={styles.proofOverlay}>
          <div style={styles.proofCard}>
            <RadarSpinner size={48} />
            <span style={styles.proofTitle}>{t('gameover.verifyingProof', 'Verifying ZK Proof')}</span>
            <span style={styles.proofSubtitle}>{t('gameover.pleaseWait', 'Please wait...')}</span>
          </div>
        </div>
      )}
    </GradientContainer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scrollContainer: { flex: 1, overflowY: 'auto', width: '100%' },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl, display: 'flex', flexDirection: 'column', gap: SPACING.lg, maxWidth: 600, width: '100%', margin: '0 auto', boxSizing: 'border-box' as const },
  header: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: SPACING.xl },
  scoreContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreValue: { fontFamily: FONTS.heading, fontSize: 48, letterSpacing: 2 },
  xpContainer: {
    border: `1px solid ${COLORS.accent.gold}`,
    borderRadius: RADIUS.default,
    padding: SPACING.md,
    backgroundColor: COLORS.overlay.goldGlow,
  },
  xpRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpRight: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  multiplierBadge: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.background.dark,
    backgroundColor: COLORS.accent.gold,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: RADIUS.sharp,
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
  xpNegative: {
    color: COLORS.accent.fire,
  },
  xpContainerDefeat: {
    borderColor: COLORS.accent.fire,
    backgroundColor: COLORS.overlay.fireGlow,
  },
  modeRow: { marginTop: 4 },
  modeLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  levelRow: {
    display: 'flex',
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
    borderRadius: RADIUS.sharp,
    backgroundColor: COLORS.surface.elevated,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.sharp,
    backgroundColor: COLORS.accent.gold,
  },
  statsGrid: { display: 'flex', flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING.xs },
  statValue: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.text.primary },
  statLabel: { fontFamily: FONTS.body, fontSize: 9, color: COLORS.text.secondary, letterSpacing: 1 },
  shipsRow: { display: 'flex', flexDirection: 'row', gap: 6 },
  shipDot: { width: 18, height: 18, borderRadius: 2 },
  shipAlive: { backgroundColor: COLORS.overlay.victoryGlow, border: `1px solid ${COLORS.status.online}` },
  shipDead: { backgroundColor: COLORS.overlay.fireHit, border: `1px solid ${COLORS.accent.fire}` },
  reportToggle: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  reportTitle: { fontFamily: FONTS.heading, fontSize: 10, color: COLORS.text.secondary, letterSpacing: 2 },
  reportArrow: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.text.secondary },
  reportContent: { padding: SPACING.md, paddingTop: 0, display: 'flex', flexDirection: 'column', gap: SPACING.md },
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
  boardRevealSection: { display: 'flex', flexDirection: 'column', gap: SPACING.sm },
  revealTitle: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  boardsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  boardColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  boardLabel: {
    fontFamily: FONTS.heading,
    fontSize: 8,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  actions: { display: 'flex', flexDirection: 'column', gap: SPACING.md },
  proofOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  proofCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 32,
    borderRadius: RADIUS.lg,
    border: `1px solid ${COLORS.grid.border}`,
    backgroundColor: 'rgba(10, 25, 47, 0.95)',
    ...SHADOWS.lg,
  },
  proofTitle: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.text.accent,
    letterSpacing: 2,
  },
  proofSubtitle: {
    fontFamily: FONTS.bodyLight,
    fontSize: 12,
    color: COLORS.text.secondary,
  },
};
