import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
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
import { AI_DELAY_MIN, AI_DELAY_MAX } from '../src/constants/game';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BattleScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gridSize = state.settings.gridSize;
  const isSwipeMode = state.settings.battleView === 'swipe';
  const [swipeView, setSwipeView] = useState<'enemy' | 'player'>('enemy');

  // Auto-switch tab when turn changes (user can still manually switch)
  useEffect(() => {
    if (!isSwipeMode) return;
    if (!state.isPlayerTurn) {
      // Player just attacked: stay on enemy board 2s to see result, then show player board
      const timer = setTimeout(() => setSwipeView('player'), 2000);
      return () => clearTimeout(timer);
    } else {
      // Bot just attacked: stay on player board 2s to see bot's attack, then show enemy board
      const timer = setTimeout(() => setSwipeView('enemy'), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.isPlayerTurn, isSwipeMode]);

  // Sunk ship modal state
  const [sunkShip, setSunkShip] = useState<PlacedShip | null>(null);
  const [showSunkModal, setShowSunkModal] = useState(false);

  const showSunkAnimation = useCallback((ship: PlacedShip) => {
    setSunkShip(ship);
    setShowSunkModal(true);
    setTimeout(() => setShowSunkModal(false), 1500);
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

        const matchStats = computeMatchStats(updatedTracking, newShips, state.playerShips, true, gridSize);
        dispatch({ type: 'END_GAME', winner: 'player', matchStats });
        updateStatsAfterGame(true, matchStats);
        saveMatchToHistory(true, matchStats, gridSize);
        router.replace('/gameover');
      }, 500);
    }
  }, [state.isPlayerTurn, state.phase, state.opponentBoard, state.opponentShips, state.playerShips, state.tracking, dispatch, haptics, router, gridSize, showSunkAnimation]);

  useEffect(() => {
    if (state.isPlayerTurn || state.phase !== 'battle') return;

    const delay = AI_DELAY_MIN + Math.random() * (AI_DELAY_MAX - AI_DELAY_MIN);

    aiTimerRef.current = setTimeout(() => {
      const { position, newAI } = computeAIMove(state.ai, state.playerBoard, state.playerShips, gridSize);
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

      const updatedAI = updateAIAfterAttack(newAI, position, result, shipId, newShips, gridSize);

      dispatch({ type: 'AI_ATTACK', position, result, shipId, aiState: updatedAI });

      if (checkWinCondition(newShips)) {
        setTimeout(() => {
          const matchStats = computeMatchStats(state.tracking, state.opponentShips, newShips, false, gridSize);
          dispatch({ type: 'END_GAME', winner: 'opponent', matchStats });
          updateStatsAfterGame(false, matchStats);
          saveMatchToHistory(false, matchStats, gridSize);
          router.replace('/gameover');
        }, 500);
      }
    }, delay);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [state.isPlayerTurn, state.phase]);

  // --- Swipe mode ---
  if (isSwipeMode) {
    return (
      <GradientContainer>
        <View style={styles.container}>
          <Text style={styles.title}>BATTLE STATIONS</Text>
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
        </View>
        <SunkShipModal visible={showSunkModal} ship={sunkShip} />
      </GradientContainer>
    );
  }

  // --- Stacked mode (default) ---
  return (
    <GradientContainer>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        <Text style={styles.title}>BATTLE STATIONS</Text>

        <TurnIndicator isPlayerTurn={state.isPlayerTurn} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ENEMY WATERS</Text>
          <GameBoard
            board={state.opponentBoard}
            onCellPress={state.isPlayerTurn ? handlePlayerAttack : undefined}
            disabled={!state.isPlayerTurn}
            showShips={false}
            gridSize={gridSize}
          />
        </View>

        <View style={styles.fleetRow}>
          <FleetStatus ships={state.opponentShips} label="ENEMY FLEET" />
          <FleetStatus ships={state.playerShips} label="YOUR FLEET" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR WATERS</Text>
          <GameBoard
            board={state.playerBoard}
            showShips
            compact
            disabled
            gridSize={gridSize}
          />
        </View>
      </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.text.accent,
    letterSpacing: 3,
    textAlign: 'center',
  },
  section: {
    gap: SPACING.xs,
  },
  sectionLabel: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  fleetRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
