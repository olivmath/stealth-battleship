import { storage } from '../shared/storage';

const USER_KEY = '@stealth_user';

function safeParse<T>(data: string, fallback: T): T {
  try { return JSON.parse(data) as T; } catch { return fallback; }
}

export async function savePlayerName(name: string): Promise<void> {
  await storage.setItem(USER_KEY, JSON.stringify({ name }));
}

export async function getPlayerName(): Promise<string | null> {
  const data = await storage.getItem(USER_KEY);
  if (!data) return null;
  return safeParse<{ name: string }>(data, { name: '' }).name || null;
}

export async function clearPlayerData(): Promise<void> {
  await storage.removeItem(USER_KEY);
}
