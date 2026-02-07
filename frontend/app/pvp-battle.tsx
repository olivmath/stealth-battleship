import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
import { createInitialAIState } from '../src/engine/ai';
import { computeMatchStats } from '../src/engine/stats';
import { updateStatsAfterGame, saveMatchToHistory } from '../src/storage/scores';
import { Position, PlacedShip } from '../src/types/game';
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

export default function PvPBattleScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedPositionsRef = useRef(new Set<string>());

  const gridSize = state.settings.gridSize;

  // Compute grid sizing
  const FULL_LABEL = getLabelSize('full');
  const mainCellSize = computeCellSize(CONTENT_WIDTH, 'full', gridSize);
  const GRID_TOTAL_WIDTH = mainCellSize * gridSize + FULL_LABEL;
  const MINI_MAX_WIDTH = Math.floor(GRID_TOTAL_WIDTH * 0.75);

  // Sunk ship modal
  const [sunkShip, setSunkShip] = useState<PlacedShip | null>(null);
  const [showSunkModal, setShowSunkModal] = useState(false);

  const showSunkAnimation = useCallback((ship: PlacedShip) => {
    setSunkShip(ship);
    setShowSunkModal(true);
    setTimeout(() => setShowSunkModal(false), 2000);
  }, []);

  // Custom turn indicator text
  const turnText = state.isPlayerTurn
    ? 'YOUR TURN'
    : `${MOCK_OPPONENT.toUpperCase()}'S TURN`;

  // Player attack
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

    if (checkWinCondition(newShips)) {
      setTimeout(() => {
        const matchStats = computeMatchStats(state.tracking, newShips, state.playerShips, true, gridSize, 'normal');
        dispatch({ type: 'END_GAME', winner: 'player', matchStats });
        updateStatsAfterGame(true, matchStats);
        saveMatchToHistory(true, matchStats, gridSize, 'normal');
        router.replace('/pvp-gameover');
      }, 500);
    }
  }, [state.isPlayerTurn, state.phase, state.opponentBoard, state.opponentShips, state.playerShips, state.tracking, dispatch, haptics, router, gridSize, showSunkAnimation]);

  // Opponent mock attack
  useEffect(() => {
    if (state.isPlayerTurn || state.phase !== 'battle') return;

    const delay = OPPONENT_ATTACK_DELAY_MIN + Math.random() * (OPPONENT_ATTACK_DELAY_MAX - OPPONENT_ATTACK_DELAY_MIN);

    opponentTimerRef.current = setTimeout(() => {
      const position = generateMockAttack(state.playerBoard, firedPositionsRef.current, gridSize);
      if (!position) return;

      firedPositionsRef.current.add(posKey(position));

      const { newShips, result, shipId } = processAttack(
        state.playerBoard,
        state.playerShips,
        position
      );

      if (result === 'miss') haptics.light();
      else if (result === 'hit') haptics.medium();
      else if (result === 'sunk') {
        haptics.sunk();
        const sunk = newShips.find(s => s.id === shipId);
        if (sunk) setTimeout(() => showSunkAnimation(sunk), 1000);
      }

      dispatch({ type: 'AI_ATTACK', position, result, shipId, aiState: createInitialAIState() });

      if (checkWinCondition(newShips)) {
        setTimeout(() => {
          const matchStats = computeMatchStats(state.tracking, state.opponentShips, newShips, false, gridSize, 'normal');
          dispatch({ type: 'END_GAME', winner: 'opponent', matchStats });
          updateStatsAfterGame(false, matchStats);
          saveMatchToHistory(false, matchStats, gridSize, 'normal');
          router.replace('/pvp-gameover');
        }, 500);
      }
    }, delay);

    return () => {
      if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
    };
  }, [state.isPlayerTurn, state.phase]);

  // Timer expiry: player loses their turn with a random attack
  const handleTimerExpire = useCallback(() => {
    if (!state.isPlayerTurn || state.phase !== 'battle') return;

    // Auto-fire a random shot on the opponent board
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
    const { newShips, result, shipId } = processAttack(
      state.opponentBoard,
      state.opponentShips,
      position
    );

    haptics.light();
    dispatch({ type: 'PLAYER_ATTACK', position, result, shipId });

    if (checkWinCondition(newShips)) {
      setTimeout(() => {
        const matchStats = computeMatchStats(state.tracking, newShips, state.playerShips, true, gridSize, 'normal');
        dispatch({ type: 'END_GAME', winner: 'player', matchStats });
        updateStatsAfterGame(true, matchStats);
        saveMatchToHistory(true, matchStats, gridSize, 'normal');
        router.replace('/pvp-gameover');
      }, 500);
    }
  }, [state.isPlayerTurn, state.phase, state.opponentBoard, state.opponentShips, state.playerShips, state.tracking, dispatch, haptics, router, gridSize]);

  const handleSurrender = () => {
    Alert.alert(
      'Surrender',
      'Are you sure you want to surrender this PvP match?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Surrender',
          style: 'destructive',
          onPress: () => {
            if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
            const matchStats = computeMatchStats(state.tracking, state.opponentShips, state.playerShips, false, gridSize, 'normal');
            dispatch({ type: 'END_GAME', winner: 'opponent', matchStats });
            updateStatsAfterGame(false, matchStats);
            saveMatchToHistory(false, matchStats, gridSize, 'normal');
            router.replace('/pvp-gameover');
          },
        },
      ]
    );
  };

  return (
    <GradientContainer>
      <View style={styles.container}>
        <OpponentStatus name={MOCK_OPPONENT} status="online" />

        {/* Turn indicator with custom text */}
        <View
          style={[styles.turnContainer, !state.isPlayerTurn && styles.turnContainerEnemy]}
        >
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

          {/* Bottom panel */}
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
  // Custom turn indicator
  turnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.accent.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  turnContainerEnemy: {
    borderColor: COLORS.accent.fire,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
  // Grid
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
});
