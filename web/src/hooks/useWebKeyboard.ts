import { useEffect } from 'react';

type KeyHandler = (key: string, event: KeyboardEvent) => void;

export function useWebKeyboard(handler: KeyHandler, deps: any[] = []) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => handler(e.key, e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, deps);
}
