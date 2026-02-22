import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import GameBoard, { getLabelSize, computeCellSize } from '../src/components/Board/GameBoard';
import TurnIndicator from '../src/components/Battle/TurnIndicator';
import FleetStatus from '../src/components/Battle/FleetStatus';
import BattleStats from '../src/components/Battle/BattleStats';
import SunkShipModal from '../src/components/Battle/SunkShipModal';
import OpponentStatus from '../src/components/PvP/OpponentStatus';
import TurnTimer from '../src/components/PvP/TurnTimer';
import { useGame } from '../src/game/translator';
import { useHaptics } from '../src/hooks/useHaptics';
import { processAttack, checkWinCondition } from '../src/game/engine';
import { Position, PlacedShip } from '../src/shared/entities';
import { shotProof, toShipTuples } from '../src/zk';
import type { ShipTuples } from '../src/zk';
import { useGameEffects } from '../src/game/translator';
import { DIFFICULTY_CONFIG } from '../src/shared/constants';
import {
  MOCK_OPPONENT,
  OPPONENT_ATTACK_DELAY_MIN,
  OPPONENT_ATTACK_DELAY_MAX,
  TURN_TIMER_SECONDS,
} from '../src/services/pvpMock';
import { OpponentStrategy, LocalAIStrategy, MockPvPStrategy } from '../src/game/engine';
import { COLORS, FONTS, SPACING, RADIUS, LAYOUT } from '../src/shared/theme';
import Spacer from '../src/components/UI/Spacer';
import { useTranslation } from 'react-i18next';

const SCREEN_PADDING = LAYOUT.screenPadding;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = Math.min(SCREEN_WIDTH - SCREEN_PADDING * 2, LAYOUT.maxContentWidth);

export default function BattleScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isPvP = mode === 'pvp';
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const { endGame } = useGameEffects();
  const gridSize = state.settings.gridSize;
  const difficulty = 'hard' as const;
  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const isSwipeMode = !isPvP && state.settings.battleView === 'swipe';
  const [swipeView, setSwipeView] = useState<'enemy' | 'player'>('enemy');
  const gameoverRoute = isPvP ? '/gameover?mode=pvp' : '/gameover';

  // Opponent strategy: AI or MockPvP
  const strategyRef = useRef<OpponentStrategy>(
    isPvP
      ? new MockPvPStrategy()
      : new LocalAIStrategy(state.opponent, gridSize, difficulty)
  );

  // Compute actual enemy grid width for alignment
  const FULL_LABEL = getLabelSize('full');
  const mainCellSize = computeCellSize(CONTENT_WIDTH, 'full', gridSize);
  const GRID_TOTAL_WIDTH = mainCellSize * gridSize + FULL_LABEL;
  const MINI_MAX_WIDTH = Math.floor(GRID_TOTAL_WIDTH * 0.75);

  // Auto-switch to the relevant board when turn changes (swipe mode)
  useEffect(() => {
    if (!isSwipeMode) return;
    if (!state.isPlayerTurn) {
      setSwipeView('player');
    } else {
      const timer = setTimeout(() => setSwipeView('enemy'), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.isPlayerTurn, isSwipeMode]);

  // Track last enemy attack for flash animation
  const [lastEnemyAttack, setLastEnemyAttack] = useState<Position | null>(null);

  // Sunk ship modal state
  const [sunkShip, setSunkShip] = useState<PlacedShip | null>(null);
  const [showSunkModal, setShowSunkModal] = useState(false);

  const showSunkAnimation = useCallback((ship: PlacedShip) => {
    setSunkShip(ship);
    setShowSunkModal(true);
    setTimeout(() => setShowSunkModal(false), 2000);
  }, []);

  // ZK: blocking shotProof — game waits for proof before advancing
  const [provingShot, setProvingShot] = useState(false);

  const generateShotProof = useCallback(async (
    ships: ShipTuples,
    nonce: string,
    boardHash: string,
    row: number,
    col: number,
    isHit: boolean,
    label: string,
  ) => {
    setProvingShot(true);
    try {
      const result = await shotProof({ ships, nonce, boardHash, row, col, isHit });
      console.log(`[ZK] shotProof ${label} OK — ${result.proof.length} bytes`);
    } catch (err: any) {
      console.warn(`[ZK] shotProof ${label} FAILED:`, err.message);
    } finally {
      setProvingShot(false);
    }
  }, []);

  // Player attack (shared between arcade and pvp)
  const handlePlayerAttack = useCallback(async (position: Position) => {
    if (!state.isPlayerTurn || state.phase !== 'battle' || provingShot) return;

    const cell = state.opponentBoard[position.row][position.col];
    if (cell.state !== 'empty' && cell.state !== 'ship') return;

    const { newShips, result, shipId } = processAttack(
      state.opponentBoard,
      state.opponentShips,
      position
    );

    if (result === 'miss') haptics.light();
    else if (result === 'hit') haptics.medium();
    else if (result === 'sunk') {
      haptics.sunk();
      const sunk = newShips.find(s => s.id === shipId);
      if (sunk) setTimeout(() => showSunkAnimation(sunk), 1000);
    }

    dispatch({ type: 'PLAYER_ATTACK', position, result, shipId });

    // ZK: prove attack result — blocks turn until proof returns
    if (state.commitment?.opponentZk) {
      const { nonce, boardHash } = state.commitment.opponentZk;
      try {
        const opponentTuples = toShipTuples(state.opponentShips);
        await generateShotProof(opponentTuples, nonce, boardHash, position.row, position.col, result !== 'miss', 'player→opponent');
      } catch (e) {
        // toShipTuples may fail if ships count doesn't match during game end
      }
    }
  }, [state.isPlayerTurn, state.phase, state.opponentBoard, state.opponentShips, state.commitment, dispatch, haptics, showSunkAnimation, generateShotProof, provingShot]);

  // Opponent turn: unified via strategy pattern
  useEffect(() => {
    if (state.isPlayerTurn || state.phase !== 'battle' || provingShot) return;

    let cancelled = false;

    const runOpponentTurn = async () => {
      const strategy = strategyRef.current;
      const position = strategy.computeMove(state.playerBoard, state.playerShips, gridSize);
      if (!position) return;

      setLastEnemyAttack(position);
      const { newShips, result, shipId } = processAttack(state.playerBoard, state.playerShips, position);

      if (result === 'miss') haptics.light();
      else if (result === 'hit') haptics.medium();
      else if (result === 'sunk') {
        haptics.sunk();
        const sunk = newShips.find(s => s.id === shipId);
        if (sunk) setTimeout(() => showSunkAnimation(sunk), 1000);
      }

      strategy.onMoveResult(position, result, shipId, newShips);

      // ZK: prove attack result — blocks turn until proof returns
      if (state.commitment?.playerZk) {
        const { nonce, boardHash } = state.commitment.playerZk;
        try {
          const playerTuples = toShipTuples(state.playerShips);
          await generateShotProof(playerTuples, nonce, boardHash, position.row, position.col, result !== 'miss', 'opponent→player');
        } catch (e) {
          // toShipTuples may fail if ships count doesn't match during game end
        }
      }

      if (!cancelled) {
        dispatch({ type: 'OPPONENT_ATTACK', position, result, shipId, opponentState: strategy.getState() });
      }
    };

    runOpponentTurn();
    return () => { cancelled = true; };
  }, [state.isPlayerTurn, state.phase, provingShot]);

  // Win detection: player victory
  useEffect(() => {
    if (state.phase !== 'battle' || state.opponentShips.length === 0) return;
    if (checkWinCondition(state.opponentShips)) {
      const timer = setTimeout(() => {
        endGame({ won: true, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute, commitment: state.commitment });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.opponentShips]);

  // Win detection: opponent victory
  useEffect(() => {
    if (state.phase !== 'battle' || state.playerShips.length === 0) return;
    if (checkWinCondition(state.playerShips)) {
      const timer = setTimeout(() => {
        endGame({ won: false, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute, commitment: state.commitment });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.playerShips]);

  // PvP timer expiry: auto-fire random shot
  const handleTimerExpire = useCallback(() => {
    if (!state.isPlayerTurn || state.phase !== 'battle') return;
    const available: Position[] = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cell = state.opponentBoard[row][col];
        if (cell.state === 'empty' || cell.state === 'ship') {
          available.push({ row, col });
        }
      }
    }
    if (available.length === 0) return;
    const position = available[Math.floor(Math.random() * available.length)];
    const { result, shipId } = processAttack(state.opponentBoard, state.opponentShips, position);
    haptics.light();
    dispatch({ type: 'PLAYER_ATTACK', position, result, shipId });
  }, [state.isPlayerTurn, state.phase, state.opponentBoard, state.opponentShips, dispatch, haptics]);

  const handleSurrender = () => {
    Alert.alert(
      t('battle.surrenderTitle'),
      isPvP ? t('battle.surrenderPvpMsg') : t('battle.surrenderMsg'),
      [
        { text: t('battle.cancel'), style: 'cancel' },
        {
          text: t('battle.surrenderTitle'),
          style: 'destructive',
          onPress: () => {
            endGame({ won: false, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute, commitment: state.commitment });
          },
        },
      ]
    );
  };

  // PvP custom turn indicator text
  const turnText = isPvP
    ? state.isPlayerTurn ? t('battle.yourTurn') : `${MOCK_OPPONENT.toUpperCase()}'S TURN`
    : undefined;

  // --- Swipe mode (arcade only) ---
  if (isSwipeMode) {
    return (
      <GradientContainer>
        <View style={styles.container}>
          <TurnIndicator isPlayerTurn={state.isPlayerTurn} />
          {provingShot && (
            <View style={styles.provingIndicator}>
              <RadarSpinner size={16} />
              <Text style={styles.provingText}>{t('battle.proving')}</Text>
            </View>
          )}

          <View style={styles.swipeTabs}>
            <TouchableOpacity
              style={[styles.swipeTab, swipeView === 'enemy' && styles.swipeTabActive]}
              onPress={() => setSwipeView('enemy')}
            >
              <Text style={[styles.swipeTabText, swipeView === 'enemy' && styles.swipeTabTextActive]}>
                {t('battle.enemyWaters')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.swipeTab, swipeView === 'player' && styles.swipeTabActive]}
              onPress={() => setSwipeView('player')}
            >
              <Text style={[styles.swipeTabText, swipeView === 'player' && styles.swipeTabTextActive]}>
                {t('battle.yourWaters')}
              </Text>
            </TouchableOpacity>
          </View>

          {swipeView === 'enemy' ? (
            <View style={styles.swipeBoard}>
              <GameBoard
                board={state.opponentBoard}
                onCellPress={state.isPlayerTurn ? handlePlayerAttack : undefined}
                disabled={!state.isPlayerTurn}
                showShips={false}
                gridSize={gridSize}
                isOpponent
                maxWidth={CONTENT_WIDTH}
                variant="full"
              />
              <FleetStatus ships={state.opponentShips} label={t('battle.enemyFleet')} />
            </View>
          ) : (
            <View style={styles.swipeBoard}>
              <GameBoard
                board={state.playerBoard}
                showShips
                disabled
                gridSize={gridSize}
                maxWidth={CONTENT_WIDTH}
                variant="full"
                lastAttackPosition={lastEnemyAttack}
              />
              <FleetStatus ships={state.playerShips} label={t('battle.yourFleet')} />
            </View>
          )}
          <NavalButton
            title={t('battle.surrender')}
            onPress={handleSurrender}
            variant="danger"
            size="small"
            accessibilityHint="Forfeit the current battle"
          />
        </View>
        <SunkShipModal visible={showSunkModal} ship={sunkShip} onDismiss={() => setShowSunkModal(false)} />
      </GradientContainer>
    );
  }

  // --- Stacked mode (default for both arcade and pvp) ---
  return (
    <GradientContainer>
      <View style={styles.container}>
        {/* PvP: opponent status + custom turn indicator + timer */}
        {isPvP && <OpponentStatus name={MOCK_OPPONENT} status="online" />}

        {isPvP ? (
          <>
            <View style={[styles.turnContainer, !state.isPlayerTurn && styles.turnContainerEnemy]}>
              <View style={[styles.turnDot, { backgroundColor: state.isPlayerTurn ? COLORS.accent.gold : COLORS.accent.fire }]} />
              <Text style={[styles.turnText, !state.isPlayerTurn && styles.turnTextEnemy]}>
                {turnText}
              </Text>
            </View>
            <TurnTimer
              duration={TURN_TIMER_SECONDS}
              isActive={state.phase === 'battle'}
              isPlayerTurn={state.isPlayerTurn}
              onExpire={handleTimerExpire}
            />
          </>
        ) : (
          <TurnIndicator isPlayerTurn={state.isPlayerTurn} />
        )}

        {provingShot && (
          <View style={styles.provingIndicator}>
            <RadarSpinner size={16} />
            <Text style={styles.provingText}>{t('battle.proving')}</Text>
          </View>
        )}

        <View style={{ width: GRID_TOTAL_WIDTH }}>
          {/* Main enemy grid */}
          <View style={styles.mainGridSection}>
            <Text style={styles.sectionLabel}>{t('battle.enemyWaters')}</Text>
            <GameBoard
              board={state.opponentBoard}
              onCellPress={state.isPlayerTurn && !provingShot ? handlePlayerAttack : undefined}
              disabled={!state.isPlayerTurn || provingShot}
              showShips={false}
              gridSize={gridSize}
              isOpponent
              maxWidth={GRID_TOTAL_WIDTH}
              variant="full"
            />
          </View>

          <Spacer size="md" />

          {/* Bottom panel: mini-map + fleet status */}
          <View style={styles.bottomPanel}>
            <View style={styles.miniMapColumn}>
              <GameBoard
                board={state.playerBoard}
                showShips
                disabled
                gridSize={gridSize}
                maxWidth={MINI_MAX_WIDTH}
                variant="mini"
                colLabelsBottom
                lastAttackPosition={lastEnemyAttack}
              />
              <Text style={styles.miniLabel}>{t('battle.yourWaters')}</Text>
            </View>
            <View style={styles.fleetColumn}>
              <FleetStatus ships={state.opponentShips} label={t('battle.enemy')} compact />
              <FleetStatus ships={state.playerShips} label={t('battle.yours')} compact />
              <BattleStats tracking={state.tracking} />
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <NavalButton
          title={t('battle.surrender')}
          onPress={handleSurrender}
          variant="danger"
          size="small"
          accessibilityHint="Forfeit the current battle"
        />
      </View>
      <SunkShipModal visible={showSunkModal} ship={sunkShip} onDismiss={() => setShowSunkModal(false)} />
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SCREEN_PADDING,
    gap: 4,
  },
  // Stacked mode
  mainGridSection: {
    alignItems: 'flex-start',
  },
  sectionLabel: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginBottom: 2,
  },
  bottomPanel: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  miniMapColumn: {
    alignItems: 'center',
    gap: 2,
  },
  miniLabel: {
    fontFamily: FONTS.heading,
    fontSize: 8,
    color: COLORS.text.secondary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  fleetColumn: {
    flex: 1,
    gap: 4,
  },
  // PvP turn indicator
  turnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: RADIUS.default,
    borderWidth: 1,
    borderColor: COLORS.accent.gold,
    backgroundColor: COLORS.overlay.goldMedium,
  },
  turnContainerEnemy: {
    borderColor: COLORS.accent.fire,
    backgroundColor: COLORS.overlay.fireGlow,
  },
  turnDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.default,
    marginRight: 8,
  },
  turnText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.text.accent,
    letterSpacing: 2,
  },
  turnTextEnemy: {
    color: COLORS.accent.fire,
  },
  // Swipe mode
  swipeTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  swipeTab: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: RADIUS.default,
    alignItems: 'center',
  },
  swipeTabActive: {
    borderColor: COLORS.accent.gold,
    backgroundColor: COLORS.overlay.goldSoft,
  },
  swipeTabText: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  swipeTabTextActive: {
    color: COLORS.accent.gold,
  },
  swipeBoard: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  provingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  provingText: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.accent.gold,
    letterSpacing: 2,
  },
});
