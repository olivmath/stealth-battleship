import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import GameBoard, { getLabelSize, computeCellSize } from '../src/components/Board/GameBoard';
import TurnIndicator from '../src/components/Battle/TurnIndicator';
import FleetStatus from '../src/components/Battle/FleetStatus';
import BattleStats from '../src/components/Battle/BattleStats';
import SunkShipModal from '../src/components/Battle/SunkShipModal';
import OpponentStatus from '../src/components/PvP/OpponentStatus';
import TurnTimer from '../src/components/PvP/TurnTimer';
import { useGame } from '../src/context/GameContext';
import { useHaptics } from '../src/hooks/useHaptics';
import { processAttack, checkWinCondition, posKey } from '../src/engine/board';
import { computeAIMove, updateAIAfterAttack, createInitialAIState } from '../src/engine/ai';
import { Position, PlacedShip } from '../src/types/game';
import { useGameEffects } from '../src/hooks/useGameEffects';
import { DIFFICULTY_CONFIG } from '../src/constants/game';
import {
  MOCK_OPPONENT,
  OPPONENT_ATTACK_DELAY_MIN,
  OPPONENT_ATTACK_DELAY_MAX,
  TURN_TIMER_SECONDS,
  generateMockAttack,
} from '../src/services/pvpMock';
import { COLORS, FONTS } from '../src/constants/theme';

const SCREEN_PADDING = 16;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = Math.min(SCREEN_WIDTH - SCREEN_PADDING * 2, 400);

export default function BattleScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isPvP = mode === 'pvp';
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const { endGame } = useGameEffects();
  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gridSize = state.settings.gridSize;
  const difficulty = isPvP ? 'normal' as const : state.settings.difficulty;
  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const isSwipeMode = !isPvP && state.settings.battleView === 'swipe';
  const [swipeView, setSwipeView] = useState<'enemy' | 'player'>('enemy');
  const gameoverRoute = isPvP ? '/gameover?mode=pvp' : '/gameover';

  // PvP: track fired positions for mock opponent
  const firedPositionsRef = useRef(new Set<string>());

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

  // Sunk ship modal state
  const [sunkShip, setSunkShip] = useState<PlacedShip | null>(null);
  const [showSunkModal, setShowSunkModal] = useState(false);

  const showSunkAnimation = useCallback((ship: PlacedShip) => {
    setSunkShip(ship);
    setShowSunkModal(true);
    setTimeout(() => setShowSunkModal(false), 2000);
  }, []);

  // Player attack (shared between arcade and pvp)
  const handlePlayerAttack = useCallback((position: Position) => {
    if (!state.isPlayerTurn || state.phase !== 'battle') return;

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
  }, [state.isPlayerTurn, state.phase, state.opponentBoard, state.opponentShips, dispatch, haptics, showSunkAnimation]);

  // Opponent turn: AI (arcade) or mock (pvp)
  useEffect(() => {
    if (state.isPlayerTurn || state.phase !== 'battle') return;

    if (isPvP) {
      // PvP mock opponent
      const delay = OPPONENT_ATTACK_DELAY_MIN + Math.random() * (OPPONENT_ATTACK_DELAY_MAX - OPPONENT_ATTACK_DELAY_MIN);
      opponentTimerRef.current = setTimeout(() => {
        const position = generateMockAttack(state.playerBoard, firedPositionsRef.current, gridSize);
        if (!position) return;
        firedPositionsRef.current.add(posKey(position));

        const { newShips, result, shipId } = processAttack(state.playerBoard, state.playerShips, position);
        if (result === 'miss') haptics.light();
        else if (result === 'hit') haptics.medium();
        else if (result === 'sunk') {
          haptics.sunk();
          const sunk = newShips.find(s => s.id === shipId);
          if (sunk) setTimeout(() => showSunkAnimation(sunk), 1000);
        }
        dispatch({ type: 'AI_ATTACK', position, result, shipId, aiState: createInitialAIState() });
      }, delay);
    } else {
      // Arcade AI
      const delay = diffConfig.delayMin + Math.random() * (diffConfig.delayMax - diffConfig.delayMin);
      opponentTimerRef.current = setTimeout(() => {
        const { position, newAI } = computeAIMove(state.ai, state.playerBoard, state.playerShips, gridSize, difficulty);
        const { newShips, result, shipId } = processAttack(state.playerBoard, state.playerShips, position);

        if (result === 'miss') haptics.light();
        else if (result === 'hit') haptics.medium();
        else if (result === 'sunk') {
          haptics.sunk();
          const sunk = newShips.find(s => s.id === shipId);
          if (sunk) setTimeout(() => showSunkAnimation(sunk), 1000);
        }

        const updatedAI = updateAIAfterAttack(newAI, position, result, shipId, newShips, gridSize, difficulty);
        dispatch({ type: 'AI_ATTACK', position, result, shipId, aiState: updatedAI });
      }, delay);
    }

    return () => {
      if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
    };
  }, [state.isPlayerTurn, state.phase]);

  // Win detection: player victory
  useEffect(() => {
    if (state.phase !== 'battle' || state.opponentShips.length === 0) return;
    if (checkWinCondition(state.opponentShips)) {
      const timer = setTimeout(() => {
        endGame({ won: true, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.opponentShips]);

  // Win detection: opponent victory
  useEffect(() => {
    if (state.phase !== 'battle' || state.playerShips.length === 0) return;
    if (checkWinCondition(state.playerShips)) {
      const timer = setTimeout(() => {
        endGame({ won: false, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute });
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
      'Surrender',
      isPvP ? 'Are you sure you want to surrender this PvP match?' : 'Are you sure you want to surrender this battle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Surrender',
          style: 'destructive',
          onPress: () => {
            if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
            endGame({ won: false, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute });
          },
        },
      ]
    );
  };

  // PvP custom turn indicator text
  const turnText = isPvP
    ? state.isPlayerTurn ? 'YOUR TURN' : `${MOCK_OPPONENT.toUpperCase()}'S TURN`
    : undefined;

  // --- Swipe mode (arcade only) ---
  if (isSwipeMode) {
    return (
      <GradientContainer>
        <View style={styles.container}>
          <TurnIndicator isPlayerTurn={state.isPlayerTurn} />

          <View style={styles.swipeTabs}>
            <TouchableOpacity
              style={[styles.swipeTab, swipeView === 'enemy' && styles.swipeTabActive]}
              onPress={() => setSwipeView('enemy')}
            >
              <Text style={[styles.swipeTabText, swipeView === 'enemy' && styles.swipeTabTextActive]}>
                ENEMY WATERS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.swipeTab, swipeView === 'player' && styles.swipeTabActive]}
              onPress={() => setSwipeView('player')}
            >
              <Text style={[styles.swipeTabText, swipeView === 'player' && styles.swipeTabTextActive]}>
                YOUR WATERS
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
              <FleetStatus ships={state.opponentShips} label="ENEMY FLEET" />
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
              />
              <FleetStatus ships={state.playerShips} label="YOUR FLEET" />
            </View>
          )}
          <NavalButton
            title="SURRENDER"
            onPress={handleSurrender}
            variant="danger"
            size="small"
            accessibilityHint="Forfeit the current battle"
          />
        </View>
        <SunkShipModal visible={showSunkModal} ship={sunkShip} />
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

        <View style={{ width: GRID_TOTAL_WIDTH }}>
          {/* Main enemy grid */}
          <View style={styles.mainGridSection}>
            <Text style={styles.sectionLabel}>ENEMY WATERS</Text>
            <GameBoard
              board={state.opponentBoard}
              onCellPress={state.isPlayerTurn ? handlePlayerAttack : undefined}
              disabled={!state.isPlayerTurn}
              showShips={false}
              gridSize={gridSize}
              isOpponent
              maxWidth={GRID_TOTAL_WIDTH}
              variant="full"
            />
          </View>

          <View style={{ height: 16 }} />

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
              />
              <Text style={styles.miniLabel}>YOUR WATERS</Text>
            </View>
            <View style={styles.fleetColumn}>
              <FleetStatus ships={state.opponentShips} label="ENEMY" compact />
              <FleetStatus ships={state.playerShips} label="YOURS" compact />
              <BattleStats tracking={state.tracking} />
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <NavalButton
          title="SURRENDER"
          onPress={handleSurrender}
          variant="danger"
          size="small"
          accessibilityHint="Forfeit the current battle"
        />
      </View>
      <SunkShipModal visible={showSunkModal} ship={sunkShip} />
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
});
