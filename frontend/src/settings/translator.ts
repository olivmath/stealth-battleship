import { useState, useEffect, useCallback } from 'react';
import { loadSettings, saveSettings } from './interactor';
import type { GameSettings } from './entities';

export function useSettings() {
  const [settings, setSettingsState] = useState<GameSettings>({
    gridSize: 10,
    battleView: 'stacked',
    difficulty: 'normal',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings().then(s => {
      setSettingsState(s);
      setLoading(false);
    });
  }, []);

  const update = useCallback(async (newSettings: GameSettings) => {
    await saveSettings(newSettings);
    setSettingsState(newSettings);
  }, []);

  const refresh = useCallback(async () => {
    const s = await loadSettings();
    setSettingsState(s);
  }, []);

  return { settings, loading, update, refresh };
}
