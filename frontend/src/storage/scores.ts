import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerStats } from '../types/game';

const USER_KEY = '@battleship_user';
const SCORES_KEY = '@battleship_scores';

const DEFAULT_STATS: PlayerStats = {
  wins: 0,
  losses: 0,
  totalShots: 0,
  totalHits: 0,
};

export async function savePlayerName(name: string): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify({ name }));
}

export async function getPlayerName(): Promise<string | null> {
  const data = await AsyncStorage.getItem(USER_KEY);
  if (!data) return null;
  return JSON.parse(data).name;
}

export async function getPlayerStats(): Promise<PlayerStats> {
  const data = await AsyncStorage.getItem(SCORES_KEY);
  if (!data) return DEFAULT_STATS;
  return JSON.parse(data);
}

export async function savePlayerStats(stats: PlayerStats): Promise<void> {
  await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(stats));
}

export async function updateStatsAfterGame(
  won: boolean,
  shotsFired: number,
  shotsHit: number
): Promise<PlayerStats> {
  const current = await getPlayerStats();
  const updated: PlayerStats = {
    wins: current.wins + (won ? 1 : 0),
    losses: current.losses + (won ? 0 : 1),
    totalShots: current.totalShots + shotsFired,
    totalHits: current.totalHits + shotsHit,
  };
  await savePlayerStats(updated);
  return updated;
}
