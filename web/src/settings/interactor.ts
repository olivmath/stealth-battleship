import { getSettings, saveSettings, hasSeenTutorial, setTutorialSeen } from './adapter';
import type { GameSettings } from './entities';

export async function loadSettings(): Promise<GameSettings> {
  return getSettings();
}

export { saveSettings, hasSeenTutorial, setTutorialSeen };
export type { GameSettings };
