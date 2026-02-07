import React, { useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import GameBoard from '../src/components/Board/GameBoard';
import TurnIndicator from '../src/components/Battle/TurnIndicator';
import FleetStatus from '../src/components/Battle/FleetStatus';
import { useGame } from '../src/context/GameContext';
import { useHaptics } from '../src/hooks/useHaptics';
import { processAttack, checkWinCondition } from '../src/engine/board';
import { computeAIMove, updateAIAfterAttack } from '../src/engine/ai';
import { computeMatchStats } from '../src/engine/stats';
import { updateStatsAfterGame, saveMatchToHistory } from '../src/storage/scores';
import { Position } from '../src/types/game';
import { AI_DELAY_MIN, AI_DELAY_MAX, GRID_SIZE } from '../src/constants/game';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

export default function BattleScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    else if (result === 'sunk') haptics.sunk();

    dispatch({ type: 'PLAYER_ATTACK', position, result, shipId });

    if (checkWinCondition(newShips)) {
      setTimeout(() => {
        // Compute stats from the updated tracking (after this dispatch processes)
        // We need to account for the shot we just fired
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

        const matchStats = computeMatchStats(updatedTracking, newShips, state.playerShips, true);
        dispatch({ type: 'END_GAME', winner: 'player', matchStats });
        updateStatsAfterGame(true, matchStats);
        saveMatchToHistory(true, matchStats, GRID_SIZE);
        router.replace('/gameover');
      }, 500);
    }
  }, [state.isPlayerTurn, state.phase, state.opponentBoard, state.opponentShips, state.playerShips, state.tracking, dispatch, haptics, router]);

  useEffect(() => {
    if (state.isPlayerTurn || state.phase !== 'battle') return;

    const delay = AI_DELAY_MIN + Math.random() * (AI_DELAY_MAX - AI_DELAY_MIN);

    aiTimerRef.current = setTimeout(() => {
      const { position, newAI } = computeAIMove(state.ai, state.playerBoard, state.playerShips);
      const { newShips, result, shipId } = processAttack(
        state.playerBoard,
        state.playerShips,
        position
      );

      if (result === 'miss') haptics.light();
      else if (result === 'hit') haptics.medium();
      else if (result === 'sunk') haptics.sunk();

      const updatedAI = updateAIAfterAttack(newAI, position, result, shipId, newShips);

      dispatch({ type: 'AI_ATTACK', position, result, shipId, aiState: updatedAI });

      if (checkWinCondition(newShips)) {
        setTimeout(() => {
          const matchStats = computeMatchStats(state.tracking, state.opponentShips, newShips, false);
          dispatch({ type: 'END_GAME', winner: 'opponent', matchStats });
          updateStatsAfterGame(false, matchStats);
          saveMatchToHistory(false, matchStats, GRID_SIZE);
          router.replace('/gameover');
        }, 500);
      }
    }, delay);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [state.isPlayerTurn, state.phase]);

  return (
    <GradientContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>BATTLE STATIONS</Text>

        <TurnIndicator isPlayerTurn={state.isPlayerTurn} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ENEMY WATERS</Text>
          <GameBoard
            board={state.opponentBoard}
            onCellPress={state.isPlayerTurn ? handlePlayerAttack : undefined}
            disabled={!state.isPlayerTurn}
            showShips={false}
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
          />
        </View>
      </ScrollView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
