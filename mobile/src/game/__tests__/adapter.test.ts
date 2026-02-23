import AsyncStorage from '@react-native-async-storage/async-storage';
import { savePlayerName, getPlayerName, clearPlayerData } from '../adapter';
import { savePlayerStats, getPlayerStats } from '../../stats/adapter';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-' + Date.now()),
}));

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

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
});

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
    await AsyncStorage.setItem('@stealth_user', JSON.stringify({ name: '' }));
    const name = await getPlayerName();
    expect(name).toBeNull();
  });

  it('handles corrupted data gracefully', async () => {
    await AsyncStorage.setItem('@stealth_user', 'not-json');
    const name = await getPlayerName();
    expect(name).toBeNull();
  });
});

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
