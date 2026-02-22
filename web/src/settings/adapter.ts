import { storage } from '../shared/storage';
import type { GameSettings } from './entities';

const SETTINGS_KEY = '@battleship_settings';
const TUTORIAL_KEY = '@battleship_tutorial';

const DEFAULT_SETTINGS: GameSettings = { gridSize: 10, difficulty: 'hard' };

function safeParse<T>(data: string, fallback: T): T {
  try { return JSON.parse(data) as T; } catch { return fallback; }
}

export async function getSettings(): Promise<GameSettings> {
  const data = await storage.getItem(SETTINGS_KEY);
  if (!data) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...safeParse(data, {}) };
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  await storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function hasSeenTutorial(): Promise<boolean> {
  const data = await storage.getItem(TUTORIAL_KEY);
  return data === 'true';
}

export async function setTutorialSeen(seen: boolean = true): Promise<void> {
  await storage.setItem(TUTORIAL_KEY, seen ? 'true' : 'false');
}
