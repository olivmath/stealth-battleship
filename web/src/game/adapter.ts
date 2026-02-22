import { storage } from '../shared/storage';
import { IGameRepository } from './interactor';
import { GameState } from '../shared/entities';

export class InMemoryGameRepository implements IGameRepository {
  private state: GameState | null = null;
  async saveGameState(state: GameState): Promise<void> { this.state = state; }
  async getGameState(): Promise<GameState | null> { return this.state; }
  async resetGame(): Promise<void> { this.state = null; }
}

const USER_KEY = '@battleship_user';

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
