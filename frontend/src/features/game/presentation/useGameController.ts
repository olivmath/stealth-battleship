import { useState, useCallback, useEffect } from 'react';
import { GameModule } from '../main/GameDI';
import { PlacedShip, Position, Orientation, AttackResult, GameState } from '../../../types/game';

// Controller/Presenter
export function useGameController() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Dependencies injected from DI container
  const module = GameModule.getInstance();

  const loadState = useCallback(async () => {
    // In real app, this might be reactive
    const state = await module.repository.getGameState(); // Temporary
    setGameState(state);
  }, []);

  const placeShip = async (ship: any, pos: Position, orientation: Orientation) => {
    try {
      const result = await module.placeShip.execute(ship, pos, orientation);
      if (result) {
        await loadState();
      } else {
        setError('Invalid placement');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error placing ship');
    }
  };

  const attack = async (pos: Position): Promise<AttackResult | null> => {
    try {
      const result = await module.attack.execute(pos);
      if (result) {
        await loadState();
      }
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error attacking');
      return null;
    }
  };

  useEffect(() => {
    loadState();
  }, [loadState]);

  return {
    gameState,
    placeShip,
    attack,
    error,
    clearError: () => setError(null)
  };
}
