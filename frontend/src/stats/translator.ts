import { useState, useEffect, useCallback } from 'react';
import { getPlayerStats, getMatchHistory } from './adapter';
import type { PlayerStats, MatchRecord } from './entities';

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
