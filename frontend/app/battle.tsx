import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import GameBoard from '../src/components/Board/GameBoard';
import TurnIndicator from '../src/components/Battle/TurnIndicator';
import FleetStatus from '../src/components/Battle/FleetStatus';
import SunkShipModal from '../src/components/Battle/SunkShipModal';
import { useGame } from '../src/context/GameContext';
import { useHaptics } from '../src/hooks/useHaptics';
import { processAttack, checkWinCondition } from '../src/engine/board';
import { computeAIMove, updateAIAfterAttack } from '../src/engine/ai';
import { computeMatchStats } from '../src/engine/stats';
import { updateStatsAfterGame, saveMatchToHistory } from '../src/storage/scores';
import { Position, PlacedShip } from '../src/types/game';
import { DIFFICULTY_CONFIG } from '../src/constants/game';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BattleScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gridSize = state.settings.gridSize;
  const difficulty = state.settings.difficulty;
  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const isSwipeMode = state.settings.battleView === 'swipe';
  const [swipeView, setSwipeView] = useState<'enemy' | 'player'>('enemy');

  // Auto-switch to the relevant board when turn changes
  useEffect(() => {
    if (!isSwipeMode) return;
    if (!state.isPlayerTurn) {
      // Bot's turn: show player board immediately so player sees the incoming attack
      setSwipeView('player');
    } else {
      // Player's turn: wait 1s so player can see the bot's attack result, then switch
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
      if (sunk) showSunkAnimation(sunk);
    }

    dispatch({ type: 'PLAYER_ATTACK', position, result, shipId });

    if (checkWinCondition(newShips)) {
      setTimeout(() => {
        const updatedTracking = {
          ...state.tracking,
          turnNumber: state.tracking.turnNumber + 1,
          playerShots: [
            ...state.tracking.playerShots,
            { turn: state.tracking.turnNumber + 1, position, result, shipId },
          ],
          currentStreak: result !== 'miss' ? state.tracking.currentStreak + 1 : 0,
          longestStreak: result !== 'miss'
            ? Math.max(state.tracking.longestStreak, state.tracking.currentStreak + 1)
            : state.tracking.longestStreak,
          shipFirstHitTurn: { ...state.tracking.shipFirstHitTurn },
          shipSunkTurn: { ...state.tracking.shipSunkTurn },
        };
        if (shipId && !updatedTracking.shipFirstHitTurn[shipId]) {
          updatedTracking.shipFirstHitTurn[shipId] = updatedTracking.turnNumber;
        }
        if (shipId && result === 'sunk') {
          updatedTracking.shipSunkTurn[shipId] = updatedTracking.turnNumber;
        }

        const matchStats = computeMatchStats(updatedTracking, newShips, state.playerShips, true, gridSize, difficulty);
        dispatch({ type: 'END_GAME', winner: 'player', matchStats });
        updateStatsAfterGame(true, matchStats);
        saveMatchToHistory(true, matchStats, gridSize, difficulty);
        router.replace('/gameover');
      }, 500);
    }
  }, [state.isPlayerTurn, state.phase, state.opponentBoard, state.opponentShips, state.playerShips, state.tracking, dispatch, haptics, router, gridSize, showSunkAnimation]);

  useEffect(() => {
    if (state.isPlayerTurn || state.phase !== 'battle') return;

    const delay = diffConfig.delayMin + Math.random() * (diffConfig.delayMax - diffConfig.delayMin);

    aiTimerRef.current = setTimeout(() => {
      const { position, newAI } = computeAIMove(state.ai, state.playerBoard, state.playerShips, gridSize, difficulty);
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
        if (sunk) showSunkAnimation(sunk);
      }

      const updatedAI = updateAIAfterAttack(newAI, position, result, shipId, newShips, gridSize, difficulty);

      dispatch({ type: 'AI_ATTACK', position, result, shipId, aiState: updatedAI });

      if (checkWinCondition(newShips)) {
        setTimeout(() => {
          const matchStats = computeMatchStats(state.tracking, state.opponentShips, newShips, false, gridSize, difficulty);
          dispatch({ type: 'END_GAME', winner: 'opponent', matchStats });
          updateStatsAfterGame(false, matchStats);
          saveMatchToHistory(false, matchStats, gridSize, difficulty);
          router.replace('/gameover');
        }, 500);
      }
    }, delay);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [state.isPlayerTurn, state.phase]);

  const handleSurrender = () => {
    Alert.alert(
      'Surrender',
      'Are you sure you want to surrender this battle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Surrender',
          style: 'destructive',
          onPress: () => {
            if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
            const matchStats = computeMatchStats(state.tracking, state.opponentShips, state.playerShips, false, gridSize, difficulty);
            dispatch({ type: 'END_GAME', winner: 'opponent', matchStats });
            updateStatsAfterGame(false, matchStats);
            saveMatchToHistory(false, matchStats, gridSize, difficulty);
            router.replace('/gameover');
          },
        },
      ]
    );
  };

  // --- Swipe mode ---
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
            <View style={styles.fullBoard}>
              <GameBoard
                board={state.opponentBoard}
                onCellPress={state.isPlayerTurn ? handlePlayerAttack : undefined}
                disabled={!state.isPlayerTurn}
                showShips={false}
                gridSize={gridSize}
                isOpponent
              />
              <FleetStatus ships={state.opponentShips} label="ENEMY FLEET" />
            </View>
          ) : (
            <View style={styles.fullBoard}>
              <GameBoard
                board={state.playerBoard}
                showShips
                disabled
                gridSize={gridSize}
              />
              <FleetStatus ships={state.playerShips} label="YOUR FLEET" />
            </View>
          )}
          <NavalButton title="SURRENDER" onPress={handleSurrender} variant="danger" />
        </View>
        <SunkShipModal visible={showSunkModal} ship={sunkShip} />
      </GradientContainer>
    );
  }

  // --- Stacked mode (default) ---
  const miniBoardWidth = SCREEN_WIDTH * 0.6;

  return (
    <GradientContainer>
      <View style={styles.stackedContainer}>
        <TurnIndicator isPlayerTurn={state.isPlayerTurn} />

        <View style={styles.enemySection}>
          <Text style={styles.sectionLabel}>ENEMY WATERS</Text>
          <GameBoard
            board={state.opponentBoard}
            onCellPress={state.isPlayerTurn ? handlePlayerAttack : undefined}
            disabled={!state.isPlayerTurn}
            showShips={false}
            gridSize={gridSize}
            isOpponent
          />
        </View>

        <View style={styles.bottomStrip}>
          <View style={[styles.miniMapSection, { marginLeft: 20 }]}>
            <Text style={styles.miniLabel}>YOUR WATERS</Text>
            <GameBoard
              board={state.playerBoard}
              showShips
              disabled
              gridSize={gridSize}
              maxWidth={miniBoardWidth}
              hideLabels
            />
          </View>
          <View style={styles.fleetColumn}>
            <FleetStatus ships={state.opponentShips} label="ENEMY" compact />
            <FleetStatus ships={state.playerShips} label="YOURS" compact />
          </View>
        </View>

        <TouchableOpacity onPress={handleSurrender} style={styles.surrenderCompact}>
          <Text style={styles.surrenderText}>SURRENDER</Text>
        </TouchableOpacity>
      </View>
      <SunkShipModal visible={showSunkModal} ship={sunkShip} />
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  // Stacked mode styles
  stackedContainer: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  enemySection: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  sectionLabel: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  bottomStrip: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  miniMapSection: {
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
    gap: SPACING.xs,
  },
  surrenderCompact: {
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  surrenderText: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.accent.fire,
    letterSpacing: 2,
  },
  // Swipe mode styles
  swipeTabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  swipeTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    alignItems: 'center',
  },
  swipeTabActive: {
    borderColor: COLORS.accent.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
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
  fullBoard: {
    flex: 1,
    gap: SPACING.md,
  },
});
