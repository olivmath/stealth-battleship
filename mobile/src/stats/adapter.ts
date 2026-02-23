import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import type { PlayerStats, MatchRecord, MatchStats, GameCommitment } from './entities';
import type { DifficultyLevel } from '../shared/entities';

const SCORES_KEY = '@stealth_scores';
const HISTORY_KEY = '@stealth_history';

const DEFAULT_STATS: PlayerStats = {
  wins: 0,
  losses: 0,
  totalShots: 0,
  totalHits: 0,
  totalXP: 0,
};

function safeParse<T>(data: string, fallback: T): T {
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

export async function getPlayerStats(): Promise<PlayerStats> {
  const data = await AsyncStorage.getItem(SCORES_KEY);
  if (!data) return DEFAULT_STATS;
  const parsed = safeParse(data, {});
  return { ...DEFAULT_STATS, ...parsed };
}

export async function savePlayerStats(stats: PlayerStats): Promise<void> {
  await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(stats));
}

export async function updateStatsAfterGame(
  won: boolean,
  matchStats: MatchStats
): Promise<PlayerStats> {
  const current = await getPlayerStats();
  const updated: PlayerStats = {
    wins: current.wins + (won ? 1 : 0),
    losses: current.losses + (won ? 0 : 1),
    totalShots: current.totalShots + matchStats.shotsFired,
    totalHits: current.totalHits + matchStats.shotsHit,
    totalXP: Math.max(0, current.totalXP + matchStats.score),
  };
  await savePlayerStats(updated);
  return updated;
}

export async function getMatchHistory(): Promise<MatchRecord[]> {
  const data = await AsyncStorage.getItem(HISTORY_KEY);
  if (!data) return [];
  return safeParse<MatchRecord[]>(data, []);
}

export async function saveMatchToHistory(
  won: boolean,
  matchStats: MatchStats,
  gridSize: number,
  difficulty: DifficultyLevel = 'normal',
  commitment?: GameCommitment
): Promise<MatchRecord> {
  const history = await getMatchHistory();
  const record: MatchRecord = {
    id: randomUUID(),
    date: new Date().toISOString(),
    result: won ? 'victory' : 'defeat',
    score: matchStats.score,
    gridSize,
    difficulty,
    stats: matchStats,
    commitment,
  };
  history.unshift(record);
  const trimmed = history.slice(0, 50);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  return record;
}
