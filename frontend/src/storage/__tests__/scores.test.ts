import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  savePlayerName,
  getPlayerName,
  getPlayerStats,
  savePlayerStats,
  updateStatsAfterGame,
  getSettings,
  saveSettings,
  getMatchHistory,
  saveMatchToHistory,
  hasSeenTutorial,
  setTutorialSeen,
  clearPlayerData,
} from '../scores';

// --- Mock AsyncStorage ---
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
        for (const key of Object.keys(store)) {
          delete store[key];
        }
        return Promise.resolve();
      }),
    },
  };
});

// --- Mock expo-crypto ---
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-' + Date.now()),
}));

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
});

// --- Player Name ---

describe('Player Name', () => {
  it('returns null when no name saved', async () => {
    const name = await getPlayerName();
    expect(name).toBeNull();
  });

  it('saves and retrieves player name', async () => {
    await savePlayerName('Commander');
    const name = await getPlayerName();
    expect(name).toBe('Commander');
  });

  it('overwrites previous name', async () => {
    await savePlayerName('Old');
    await savePlayerName('New');
    const name = await getPlayerName();
    expect(name).toBe('New');
  });

  it('returns null for empty name', async () => {
    await AsyncStorage.setItem('@battleship_user', JSON.stringify({ name: '' }));
    const name = await getPlayerName();
    expect(name).toBeNull();
  });

  it('handles corrupted data gracefully', async () => {
    await AsyncStorage.setItem('@battleship_user', 'not-json');
    const name = await getPlayerName();
    expect(name).toBeNull();
  });
});

// --- Player Stats ---

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
    await AsyncStorage.setItem('@battleship_scores', JSON.stringify({ wins: 10 }));
    const stats = await getPlayerStats();
    expect(stats.wins).toBe(10);
    expect(stats.losses).toBe(0);
    expect(stats.totalXP).toBe(0);
  });

  it('handles corrupted data', async () => {
    await AsyncStorage.setItem('@battleship_scores', '{bad-json}');
    const stats = await getPlayerStats();
    expect(stats).toEqual(DEFAULT_STATS);
  });
});

// --- updateStatsAfterGame ---

describe('updateStatsAfterGame', () => {
  it('increments wins on victory', async () => {
    const result = await updateStatsAfterGame(true, {
      score: 100,
      accuracy: 50,
      shotsFired: 10,
      shotsHit: 5,
      shotsToWin: 10,
      totalShips: 3,
      shipsSurvived: 2,
      longestStreak: 2,
      firstBloodTurn: 1,
      perfectKills: 0,
      killEfficiency: [],
    });
    expect(result.wins).toBe(1);
    expect(result.losses).toBe(0);
    expect(result.totalShots).toBe(10);
    expect(result.totalHits).toBe(5);
    expect(result.totalXP).toBe(100);
  });

  it('increments losses on defeat', async () => {
    const result = await updateStatsAfterGame(false, {
      score: 50,
      accuracy: 30,
      shotsFired: 20,
      shotsHit: 6,
      shotsToWin: 0,
      totalShips: 3,
      shipsSurvived: 0,
      longestStreak: 1,
      firstBloodTurn: 3,
      perfectKills: 0,
      killEfficiency: [],
    });
    expect(result.wins).toBe(0);
    expect(result.losses).toBe(1);
  });

  it('accumulates across multiple games', async () => {
    const matchStats = {
      score: 100,
      accuracy: 50,
      shotsFired: 10,
      shotsHit: 5,
      shotsToWin: 10,
      totalShips: 3,
      shipsSurvived: 2,
      longestStreak: 2,
      firstBloodTurn: 1,
      perfectKills: 0,
      killEfficiency: [],
    };

    await updateStatsAfterGame(true, matchStats);
    const result = await updateStatsAfterGame(false, matchStats);

    expect(result.wins).toBe(1);
    expect(result.losses).toBe(1);
    expect(result.totalShots).toBe(20);
    expect(result.totalXP).toBe(200);
  });
});

// --- Settings ---

describe('Settings', () => {
  const DEFAULT_SETTINGS = { gridSize: 6, battleView: 'stacked', difficulty: 'normal' };

  it('returns default settings when none saved', async () => {
    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('saves and retrieves settings', async () => {
    const settings = { gridSize: 6 as const, battleView: 'swipe' as const, difficulty: 'hard' as const };
    await saveSettings(settings);
    const result = await getSettings();
    expect(result).toEqual(settings);
  });

  it('merges with defaults for partial data', async () => {
    await AsyncStorage.setItem('@battleship_settings', JSON.stringify({ gridSize: 10 }));
    const settings = await getSettings();
    expect(settings.gridSize).toBe(10);
    expect(settings.battleView).toBe('stacked');
    expect(settings.difficulty).toBe('normal');
  });
});

// --- Tutorial ---

describe('Tutorial flag', () => {
  it('returns false when not set', async () => {
    const seen = await hasSeenTutorial();
    expect(seen).toBe(false);
  });

  it('returns true after setting', async () => {
    await setTutorialSeen(true);
    const seen = await hasSeenTutorial();
    expect(seen).toBe(true);
  });

  it('can reset to false', async () => {
    await setTutorialSeen(true);
    await setTutorialSeen(false);
    const seen = await hasSeenTutorial();
    expect(seen).toBe(false);
  });

  it('defaults to true when called without argument', async () => {
    await setTutorialSeen();
    const seen = await hasSeenTutorial();
    expect(seen).toBe(true);
  });
});

// --- clearPlayerData ---

describe('clearPlayerData', () => {
  it('removes player name', async () => {
    await savePlayerName('Test');
    await clearPlayerData();
    const name = await getPlayerName();
    expect(name).toBeNull();
  });

  it('does not affect stats', async () => {
    await savePlayerStats({ wins: 5, losses: 3, totalShots: 100, totalHits: 60, totalXP: 500 });
    await savePlayerName('Test');
    await clearPlayerData();
    const stats = await getPlayerStats();
    expect(stats.wins).toBe(5);
  });
});

// --- Match History ---

describe('Match History', () => {
  it('returns empty array when no history', async () => {
    const history = await getMatchHistory();
    expect(history).toEqual([]);
  });

  it('saves a match and retrieves it', async () => {
    const matchStats = {
      score: 150,
      accuracy: 75,
      shotsFired: 12,
      shotsHit: 9,
      shotsToWin: 12,
      totalShips: 3,
      shipsSurvived: 2,
      longestStreak: 4,
      firstBloodTurn: 2,
      perfectKills: 1,
      killEfficiency: [],
    };

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
    const matchStats = {
      score: 100,
      accuracy: 50,
      shotsFired: 10,
      shotsHit: 5,
      shotsToWin: 10,
      totalShips: 3,
      shipsSurvived: 1,
      longestStreak: 2,
      firstBloodTurn: 1,
      perfectKills: 0,
      killEfficiency: [],
    };

    await saveMatchToHistory(true, matchStats, 6);
    await saveMatchToHistory(false, { ...matchStats, score: 200 }, 6);

    const history = await getMatchHistory();
    expect(history).toHaveLength(2);
    expect(history[0].score).toBe(200); // most recent first
  });

  it('trims history to 50 entries', async () => {
    const matchStats = {
      score: 100,
      accuracy: 50,
      shotsFired: 10,
      shotsHit: 5,
      shotsToWin: 10,
      totalShips: 3,
      shipsSurvived: 1,
      longestStreak: 2,
      firstBloodTurn: 1,
      perfectKills: 0,
      killEfficiency: [],
    };

    for (let i = 0; i < 55; i++) {
      await saveMatchToHistory(true, matchStats, 6);
    }

    const history = await getMatchHistory();
    expect(history).toHaveLength(50);
  });

  it('saves difficulty field', async () => {
    const matchStats = {
      score: 100,
      accuracy: 50,
      shotsFired: 10,
      shotsHit: 5,
      shotsToWin: 10,
      totalShips: 3,
      shipsSurvived: 1,
      longestStreak: 2,
      firstBloodTurn: 1,
      perfectKills: 0,
      killEfficiency: [],
    };

    const record = await saveMatchToHistory(true, matchStats, 6, 'hard');
    expect(record.difficulty).toBe('hard');
  });

  it('defaults difficulty to normal', async () => {
    const matchStats = {
      score: 100,
      accuracy: 50,
      shotsFired: 10,
      shotsHit: 5,
      shotsToWin: 10,
      totalShips: 3,
      shipsSurvived: 1,
      longestStreak: 2,
      firstBloodTurn: 1,
      perfectKills: 0,
      killEfficiency: [],
    };

    const record = await saveMatchToHistory(true, matchStats, 6);
    expect(record.difficulty).toBe('normal');
  });
});
