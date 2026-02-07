import { useState, useEffect, useCallback } from 'react';
import { getPlayerName, savePlayerName, getPlayerStats } from '../storage/scores';
import { PlayerStats } from '../types/game';

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
