import { useCallback } from 'react';

export function useHaptics() {
  const vibrate = useCallback((ms: number | number[]) => {
    try { navigator.vibrate?.(ms); } catch {}
  }, []);

  const light = useCallback(() => vibrate(10), [vibrate]);
  const medium = useCallback(() => vibrate(20), [vibrate]);
  const heavy = useCallback(() => vibrate(40), [vibrate]);
  const success = useCallback(() => vibrate([10, 30, 10]), [vibrate]);
  const error = useCallback(() => vibrate([20, 40, 20]), [vibrate]);
  const sunk = useCallback(() => vibrate([40, 100, 10, 30, 10]), [vibrate]);

  return { light, medium, heavy, success, error, sunk };
}
