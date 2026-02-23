import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPlayerStats,
  savePlayerStats,
  updateStatsAfterGame,
  getMatchHistory,
  saveMatchToHistory,
} from '../adapter';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        for (const key of Object.keys(store)) delete store[key];
        return Promise.resolve();
      }),
    },
  };
});

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-' + Date.now()),
}));

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
});

describe('Player Stats', () => {
  const DEFAULT_STATS = { wins: 0, losses: 0, totalShots: 0, totalHits: 0, totalXP: 0 };

  it('returns default stats when none saved', async () => {
    const stats = await getPlayerStats();
    expect(stats).toEqual(DEFAULT_STATS);
  });

  it('saves and retrieves stats', async () => {
    const stats = { wins: 5, losses: 3, totalShots: 100, totalHits: 60, totalXP: 500 };
    await savePlayerStats(stats);
    const result = await getPlayerStats();
    expect(result).toEqual(stats);
  });

  it('merges with defaults for partial data', async () => {
    await AsyncStorage.setItem('@stealth_scores', JSON.stringify({ wins: 10 }));
    const stats = await getPlayerStats();
    expect(stats.wins).toBe(10);
    expect(stats.losses).toBe(0);
    expect(stats.totalXP).toBe(0);
  });

  it('handles corrupted data', async () => {
    await AsyncStorage.setItem('@stealth_scores', '{bad-json}');
    const stats = await getPlayerStats();
    expect(stats).toEqual(DEFAULT_STATS);
  });
});

describe('updateStatsAfterGame', () => {
  it('increments wins on victory', async () => {
    const result = await updateStatsAfterGame(true, {
      score: 100, accuracy: 50, shotsFired: 10, shotsHit: 5, shotsToWin: 10,
      totalShips: 3, shipsSurvived: 2, longestStreak: 2, firstBloodTurn: 1,
      perfectKills: 0, killEfficiency: [],
    });
    expect(result.wins).toBe(1);
    expect(result.losses).toBe(0);
    expect(result.totalShots).toBe(10);
    expect(result.totalHits).toBe(5);
    expect(result.totalXP).toBe(100);
  });

  it('increments losses on defeat', async () => {
    const result = await updateStatsAfterGame(false, {
      score: 50, accuracy: 30, shotsFired: 20, shotsHit: 6, shotsToWin: 0,
      totalShips: 3, shipsSurvived: 0, longestStreak: 1, firstBloodTurn: 3,
      perfectKills: 0, killEfficiency: [],
    });
    expect(result.wins).toBe(0);
    expect(result.losses).toBe(1);
  });

  it('accumulates across multiple games', async () => {
    const matchStats = {
      score: 100, accuracy: 50, shotsFired: 10, shotsHit: 5, shotsToWin: 10,
      totalShips: 3, shipsSurvived: 2, longestStreak: 2, firstBloodTurn: 1,
      perfectKills: 0, killEfficiency: [],
    };
    await updateStatsAfterGame(true, matchStats);
    const result = await updateStatsAfterGame(false, matchStats);
    expect(result.wins).toBe(1);
    expect(result.losses).toBe(1);
    expect(result.totalShots).toBe(20);
    expect(result.totalXP).toBe(200);
  });
});

describe('Match History', () => {
  const matchStats = {
    score: 150, accuracy: 75, shotsFired: 12, shotsHit: 9, shotsToWin: 12,
    totalShips: 3, shipsSurvived: 2, longestStreak: 4, firstBloodTurn: 2,
    perfectKills: 1, killEfficiency: [],
  };

  it('returns empty array when no history', async () => {
    const history = await getMatchHistory();
    expect(history).toEqual([]);
  });

  it('saves a match and retrieves it', async () => {
    const record = await saveMatchToHistory(true, matchStats, 6);
    expect(record.result).toBe('victory');
    expect(record.score).toBe(150);
    expect(record.gridSize).toBe(6);
    expect(record.id).toBeTruthy();

    const history = await getMatchHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(record.id);
  });

  it('stores most recent match first', async () => {
    const ms = { ...matchStats, score: 100 };
    await saveMatchToHistory(true, ms, 6);
    await saveMatchToHistory(false, { ...ms, score: 200 }, 6);
    const history = await getMatchHistory();
    expect(history).toHaveLength(2);
    expect(history[0].score).toBe(200);
  });

  it('trims history to 50 entries', async () => {
    const ms = { ...matchStats, score: 100 };
    for (let i = 0; i < 55; i++) {
      await saveMatchToHistory(true, ms, 6);
    }
    const history = await getMatchHistory();
    expect(history).toHaveLength(50);
  });

  it('saves difficulty field', async () => {
    const record = await saveMatchToHistory(true, matchStats, 6, 'hard');
    expect(record.difficulty).toBe('hard');
  });

  it('defaults difficulty to normal', async () => {
    const record = await saveMatchToHistory(true, matchStats, 6);
    expect(record.difficulty).toBe('normal');
  });
});
