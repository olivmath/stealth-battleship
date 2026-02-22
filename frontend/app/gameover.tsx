import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSharedValue, useAnimatedProps, withTiming, useDerivedValue } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ConfettiCannon from 'react-native-confetti-cannon';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import GameBoard from '../src/components/Board/GameBoard';
import { useGame, waitForTurnsProof } from '../src/game/translator';
import { useHaptics } from '../src/hooks/useHaptics';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import { usePlayerStats } from '../src/stats/translator';
import { getLevelInfo } from '../src/stats/interactor';
import { DIFFICULTY_CONFIG } from '../src/shared/constants';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, FONT_SIZES } from '../src/shared/theme';
import NavalText from '../src/components/UI/NavalText';
import Card from '../src/components/UI/Card';
import Divider from '../src/components/UI/Divider';
import KillEfficiencyBar from '../src/components/Stats/KillEfficiencyBar';
import LevelUpModal from '../src/components/Stats/LevelUpModal';
import { MOCK_OPPONENT } from '../src/services/pvpMock';

const AnimatedText = Animated.createAnimatedComponent(Text);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_MAX = Math.floor((SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm) / 2);

function AnimatedCounter({ to, suffix = '', style, delay = 0 }: { to: number; suffix?: string; style: any; delay?: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withTiming(1, { duration: 800 });
    }, delay);
    return () => clearTimeout(timer);
  }, [to]);

  const animatedText = useDerivedValue(() => {
    const val = Math.round(progress.value * to);
    return `${val}${suffix}`;
  });

  const animatedProps = useAnimatedProps(() => ({
    text: animatedText.value,
    defaultValue: `0${suffix}`,
  } as any));

  return <AnimatedText style={style} animatedProps={animatedProps} />;
}

export default function GameOverScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { t } = useTranslation();
  const isPvP = mode === 'pvp';
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const { stats, refresh } = usePlayerStats();
  const [showReport, setShowReport] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousXP, setPreviousXP] = useState<number | null>(null);
  const [waitingProof, setWaitingProof] = useState(false);

  const isVictory = state.winner === 'player';
  const ms = state.lastMatchStats;
  const xpEarned = ms?.score ?? 0;
  const difficulty = state.settings.difficulty;
  const multiplier = DIFFICULTY_CONFIG[difficulty].scoreMultiplier;
  const gridSize = state.settings.gridSize;

  const [prevLevel, setPrevLevel] = useState<ReturnType<typeof getLevelInfo> | null>(null);

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

  const awaitProofThenNavigate = async (navigate: () => void) => {
    setWaitingProof(true);
    await waitForTurnsProof();
    setWaitingProof(false);
    navigate();
  };

  const handlePlayAgain = () => {
    haptics.light();
    awaitProofThenNavigate(() => {
      if (currentLevel.gridSize !== state.settings.gridSize) {
        const updated = { ...state.settings, gridSize: currentLevel.gridSize };
        dispatch({ type: 'LOAD_SETTINGS', settings: updated });
        import('../src/settings/interactor').then(m => m.saveSettings(updated));
      }
      dispatch({ type: 'RESET_GAME' });
      router.replace(isPvP ? '/placement?mode=pvp' : '/placement');
    });
  };

  const handleMenu = () => {
    haptics.light();
    awaitProofThenNavigate(() => {
      router.replace('/menu');
    });
  };

  const subtitle = isPvP
    ? isVictory ? t('gameover.pvpVictoryMsg', { opponent: MOCK_OPPONENT }) : t('gameover.pvpDefeatMsg', { opponent: MOCK_OPPONENT })
    : isVictory ? t('gameover.victoryMsg') : t('gameover.defeatMsg');

  return (
    <GradientContainer>
      {isVictory && (
        <ConfettiCannon
          count={200}
          origin={{ x: -10, y: 0 }}
          autoStart
          fadeOut
          fallSpeed={3000}
          explosionSpeed={350}
        />
      )}
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <NavalText variant="h1" color={isVictory ? COLORS.accent.victory : COLORS.accent.fire} letterSpacing={6} style={{ fontSize: FONT_SIZES.hero }}>
            {isVictory ? t('gameover.victory') : t('gameover.defeat')}
          </NavalText>
          <NavalText variant="body" color={COLORS.text.secondary} style={{ marginTop: SPACING.sm }}>{subtitle}</NavalText>
          <Divider width={80} color={isVictory ? COLORS.accent.gold : COLORS.accent.fire} style={{ marginTop: SPACING.md }} />
        </View>

        {/* Score */}
        {ms && (
          <View style={styles.scoreContainer}>
            <NavalText variant="label" letterSpacing={3}>{t('gameover.score')}</NavalText>
            <AnimatedCounter
              to={ms.score}
              style={[styles.scoreValue, { color: isVictory ? COLORS.accent.victory : COLORS.accent.fire }]}
              delay={200}
            />
          </View>
        )}

        {/* XP Earned + Level Progress */}
        <View style={[styles.xpContainer, !isVictory && styles.xpContainerDefeat]}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>{t('gameover.xpEarned')}</Text>
            <View style={styles.xpRight}>
              {!isPvP && multiplier !== 1 && (
                <Text style={styles.multiplierBadge}>{multiplier}x</Text>
              )}
              <Text style={[styles.xpValue, xpEarned < 0 && styles.xpNegative]}>
                {xpEarned > 0 ? `+${xpEarned}` : `${xpEarned}`}
              </Text>
            </View>
          </View>
          <View style={styles.modeRow}>
            <Text style={styles.modeLabel}>
              {isPvP ? t('common.pvpOnline') : t('difficulty.' + difficulty)}
            </Text>
          </View>
          <View style={styles.levelRow}>
            <Text style={styles.levelRank}>{t('ranks.' + currentLevel.rank).toUpperCase()}</Text>
            <Text style={styles.levelXP}>{currentLevel.currentXP} / {currentLevel.xpForNextRank}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.round(currentLevel.progress * 100)}%` }]} />
          </View>
        </View>

        {/* Primary Stats */}
        {ms && (
          <Card>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <AnimatedCounter to={ms.accuracy} suffix="%" style={styles.statValue} delay={400} />
                <Text style={styles.statLabel}>{t('gameover.accuracy')}</Text>
              </View>
              <View style={styles.statItem}>
                <AnimatedCounter to={ms.shotsFired} style={styles.statValue} delay={600} />
                <Text style={styles.statLabel}>{isVictory ? t('gameover.shotsToWin') : t('gameover.shotsFired')}</Text>
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
                <Text style={styles.statLabel}>{t('gameover.shipsSurvived')}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Battle Report (expandable) */}
        {ms && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <TouchableOpacity
              style={styles.reportToggle}
              onPress={() => {
                haptics.light();
                setShowReport(!showReport);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.reportTitle}>{t('gameover.battleReport')}</Text>
              <Text style={styles.reportArrow}>{showReport ? '\u25B2' : '\u25BC'}</Text>
            </TouchableOpacity>

            {showReport && (
              <View style={styles.reportContent}>
                {ms.killEfficiency.length > 0 && (
                  <View style={styles.reportSection}>
                    <Text style={styles.reportSectionTitle}>{t('gameover.killEfficiency')}</Text>
                    {ms.killEfficiency.map(item => (
                      <KillEfficiencyBar key={item.shipId} item={item} />
                    ))}
                  </View>
                )}

                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>{t('gameover.longestStreak')}</Text>
                  <Text style={styles.reportValue}>{ms.longestStreak}</Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>{t('gameover.firstBlood')}</Text>
                  <Text style={styles.reportValue}>
                    {ms.firstBloodTurn > 0 ? t('gameover.turn', { number: ms.firstBloodTurn }) : t('common.dash')}
                  </Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>{t('gameover.perfectKills')}</Text>
                  <Text style={[styles.reportValue, ms.perfectKills > 0 && styles.perfectText]}>
                    {ms.perfectKills} / {ms.killEfficiency.length}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Board Reveal (PvP only) */}
        {isPvP && (
          <View style={styles.boardRevealSection}>
            <Text style={styles.revealTitle}>{t('gameover.boardReveal')}</Text>
            <View style={styles.boardsRow}>
              <View style={styles.boardColumn}>
                <Text style={styles.boardLabel}>{t('gameover.yourBoard')}</Text>
                <GameBoard
                  board={state.playerBoard}
                  showShips
                  disabled
                  gridSize={gridSize}
                  maxWidth={BOARD_MAX}
                  variant="mini"
                />
              </View>
              <View style={styles.boardColumn}>
                <Text style={styles.boardLabel}>{t('gameover.opponentBoard')}</Text>
                <GameBoard
                  board={state.opponentBoard}
                  showShips
                  disabled
                  gridSize={gridSize}
                  maxWidth={BOARD_MAX}
                  variant="mini"
                />
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <NavalButton title={isPvP ? t('gameover.rematch') : t('gameover.playAgain')} onPress={handlePlayAgain} />
          <NavalButton title={t('gameover.returnToBase')} onPress={handleMenu} variant="secondary" />
        </View>
      </ScrollView>
      <LevelUpModal visible={showLevelUp} levelInfo={currentLevel} previousLevelInfo={prevLevel ?? undefined} />
      {waitingProof && (
        <View style={styles.proofOverlay}>
          <View style={styles.proofCard}>
            <RadarSpinner size={48} />
            <Text style={styles.proofTitle}>{t('gameover.verifyingProof', 'Verifying ZK Proof')}</Text>
            <Text style={styles.proofSubtitle}>{t('gameover.pleaseWait', 'Please wait...')}</Text>
          </View>
        </View>
      )}
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  header: { alignItems: 'center', marginTop: SPACING.xl },
  scoreContainer: { alignItems: 'center' },
  scoreValue: { fontFamily: FONTS.heading, fontSize: 48, letterSpacing: 2 },
  xpContainer: {
    borderWidth: 1,
    borderColor: COLORS.accent.gold,
    borderRadius: RADIUS.default,
    padding: SPACING.md,
    backgroundColor: COLORS.overlay.goldGlow,
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
  modeRow: {
    marginTop: 4,
  },
  modeLabel: {
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
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: SPACING.xs },
  statValue: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.text.primary },
  statLabel: { fontFamily: FONTS.body, fontSize: 9, color: COLORS.text.secondary, letterSpacing: 1 },
  shipsRow: { flexDirection: 'row', gap: 6 },
  shipDot: { width: 18, height: 18, borderRadius: 2, borderWidth: 1 },
  shipAlive: { backgroundColor: COLORS.overlay.victoryGlow, borderColor: COLORS.status.online },
  shipDead: { backgroundColor: COLORS.overlay.fireHit, borderColor: COLORS.accent.fire },
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
    borderBottomColor: COLORS.surface.cardBorder,
  },
  reportLabel: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.text.secondary },
  reportValue: { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.text.primary },
  perfectText: { color: COLORS.accent.gold },
  boardRevealSection: {
    gap: SPACING.sm,
  },
  revealTitle: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  boardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  boardColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  boardLabel: {
    fontFamily: FONTS.heading,
    fontSize: 8,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  actions: { gap: SPACING.md },
  proofOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  proofCard: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
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
});
