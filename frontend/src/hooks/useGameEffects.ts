import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useGame } from '../context/GameContext';
import { computeMatchStats } from '../engine/stats';
import { updateStatsAfterGame, saveMatchToHistory } from '../storage/scores';
import { BattleTracking, PlacedShip, DifficultyLevel, GameCommitment } from '../types/game';

interface EndGameParams {
  won: boolean;
  tracking: BattleTracking;
  opponentShips: PlacedShip[];
  playerShips: PlacedShip[];
  gridSize: number;
  difficulty: DifficultyLevel;
  navigateTo: string;
  commitment?: GameCommitment;
}

export function useGameEffects() {
  const router = useRouter();
  const { dispatch } = useGame();

  const endGame = useCallback(({
    won,
    tracking,
    opponentShips,
    playerShips,
    gridSize,
    difficulty,
    navigateTo,
    commitment,
  }: EndGameParams) => {
    const matchStats = computeMatchStats(tracking, opponentShips, playerShips, won, gridSize, difficulty);
    dispatch({ type: 'END_GAME', winner: won ? 'player' : 'opponent', matchStats });
    updateStatsAfterGame(won, matchStats);
    saveMatchToHistory(won, matchStats, gridSize, difficulty, commitment);
    router.replace(navigateTo as any);
  }, [dispatch, router]);

  return { endGame };
}
