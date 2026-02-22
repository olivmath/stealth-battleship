import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSettings, saveSettings, hasSeenTutorial, setTutorialSeen } from '../adapter';

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

describe('Settings', () => {
  const DEFAULT_SETTINGS = { gridSize: 10, difficulty: 'hard' };

  it('returns default settings when none saved', async () => {
    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('saves and retrieves settings', async () => {
    const settings = { gridSize: 10 as const, difficulty: 'hard' as const };
    await saveSettings(settings);
    const result = await getSettings();
    expect(result).toEqual(settings);
  });

  it('merges with defaults for partial data', async () => {
    await AsyncStorage.setItem('@battleship_settings', JSON.stringify({ gridSize: 10 }));
    const settings = await getSettings();
    expect(settings.gridSize).toBe(10);
    expect(settings.difficulty).toBe('hard');
  });
});

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
