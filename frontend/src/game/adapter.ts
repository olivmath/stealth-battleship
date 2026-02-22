// game/adapter.ts — InMemoryGameRepository + player name persistence
// Merged from: features/game/adapters/InMemoryGameRepository.ts, storage/scores.ts (player funcs)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { IGameRepository } from './interactor';
import { GameState } from '../shared/entities';

// ─── In-Memory Game Repository ──────────────────────────────────────

export class InMemoryGameRepository implements IGameRepository {
  private state: GameState | null = null;

  async saveGameState(state: GameState): Promise<void> {
    this.state = state;
  }

  async getGameState(): Promise<GameState | null> {
    return this.state;
  }

  async resetGame(): Promise<void> {
    this.state = null;
  }
}

// ─── Player Name Persistence ─────────────────────────────────────────

const USER_KEY = '@battleship_user';

function safeParse<T>(data: string, fallback: T): T {
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

export async function savePlayerName(name: string): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify({ name }));
}

export async function getPlayerName(): Promise<string | null> {
  const data = await AsyncStorage.getItem(USER_KEY);
  if (!data) return null;
  return safeParse<{ name: string }>(data, { name: '' }).name || null;
}

export async function clearPlayerData(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}
