import { useEffect } from 'react';
import { Platform } from 'react-native';

type KeyHandler = (key: string, event: KeyboardEvent) => void;

export function useWebKeyboard(handler: KeyHandler, deps: any[] = []) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const listener = (e: KeyboardEvent) => {
      handler(e.key, e);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, deps);
}
