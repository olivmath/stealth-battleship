import { useState, useEffect, useCallback } from 'react';
import { getPlayerName, savePlayerName, getPlayerStats, getSettings, saveSettings, getMatchHistory } from '../storage/scores';
import { PlayerStats, GameSettings, MatchRecord } from '../types/game';

export function usePlayerName() {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayerName().then(n => {
      setName(n);
      setLoading(false);
    });
  }, []);

  const save = useCallback(async (newName: string) => {
    await savePlayerName(newName);
    setName(newName);
  }, []);

  return { name, loading, save };
}

export function usePlayerStats() {
  const [stats, setStats] = useState<PlayerStats>({
    wins: 0,
    losses: 0,
    totalShots: 0,
    totalHits: 0,
    totalXP: 0,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await getPlayerStats();
    setStats(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
}

export function useSettings() {
  const [settings, setSettingsState] = useState<GameSettings>({
    gridSize: 6,
    battleView: 'stacked',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(s => {
      setSettingsState(s);
      setLoading(false);
    });
  }, []);

  const update = useCallback(async (newSettings: GameSettings) => {
    await saveSettings(newSettings);
    setSettingsState(newSettings);
  }, []);

  const refresh = useCallback(async () => {
    const s = await getSettings();
    setSettingsState(s);
  }, []);

  return { settings, loading, update, refresh };
}

export function useMatchHistory() {
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const h = await getMatchHistory();
    setHistory(h);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { history, loading, refresh };
}
