import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerStats, MatchRecord, MatchStats, GameSettings } from '../types/game';

const USER_KEY = '@battleship_user';
const SCORES_KEY = '@battleship_scores';
const HISTORY_KEY = '@battleship_history';
const SETTINGS_KEY = '@battleship_settings';

const DEFAULT_SETTINGS: GameSettings = {
  gridSize: 6,
  battleView: 'stacked',
};

export async function getSettings(): Promise<GameSettings> {
  const data = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!data) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const DEFAULT_STATS: PlayerStats = {
  wins: 0,
  losses: 0,
  totalShots: 0,
  totalHits: 0,
  totalXP: 0,
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
  const parsed = JSON.parse(data);
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
    totalXP: current.totalXP + matchStats.score,
  };
  await savePlayerStats(updated);
  return updated;
}

// --- Match History ---

export async function getMatchHistory(): Promise<MatchRecord[]> {
  const data = await AsyncStorage.getItem(HISTORY_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export async function saveMatchToHistory(
  won: boolean,
  matchStats: MatchStats,
  gridSize: number
): Promise<MatchRecord> {
  const history = await getMatchHistory();
  const record: MatchRecord = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    result: won ? 'victory' : 'defeat',
    score: matchStats.score,
    gridSize,
    stats: matchStats,
  };
  history.unshift(record);
  // Keep last 50 matches
  const trimmed = history.slice(0, 50);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  return record;
}
