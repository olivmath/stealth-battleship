import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, GameAction, BattleTracking } from '../types/game';
import { createEmptyBoard } from '../engine/board';
import { createInitialAIState } from '../engine/ai';

function createInitialTracking(): BattleTracking {
  return {
    turnNumber: 0,
    playerShots: [],
    aiShots: [],
    currentStreak: 0,
    longestStreak: 0,
    shipFirstHitTurn: {},
    shipSunkTurn: {},
  };
}

const initialState: GameState = {
  playerName: '',
  phase: 'login',
  playerBoard: createEmptyBoard(),
  opponentBoard: createEmptyBoard(),
  playerShips: [],
  opponentShips: [],
  isPlayerTurn: true,
  winner: null,
  ai: createInitialAIState(),
  stats: { wins: 0, losses: 0, totalShots: 0, totalHits: 0, totalXP: 0 },
  tracking: createInitialTracking(),
  lastMatchStats: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER':
      return { ...state, playerName: action.name, phase: 'menu' };

    case 'LOAD_STATS':
      return { ...state, stats: action.stats };

    case 'PLACE_SHIP': {
      const newBoard = state.playerBoard.map(r => r.map(c => ({ ...c })));
      action.ship.positions.forEach(p => {
        newBoard[p.row][p.col] = { state: 'ship', shipId: action.ship.id };
      });
      return {
        ...state,
        playerBoard: newBoard,
        playerShips: [...state.playerShips, action.ship],
      };
    }

    case 'REMOVE_SHIP': {
      const ship = state.playerShips.find(s => s.id === action.shipId);
      if (!ship) return state;
      const newBoard = state.playerBoard.map(r => r.map(c => ({ ...c })));
      ship.positions.forEach(p => {
        newBoard[p.row][p.col] = { state: 'empty', shipId: null };
      });
      return {
        ...state,
        playerBoard: newBoard,
        playerShips: state.playerShips.filter(s => s.id !== action.shipId),
      };
    }

    case 'START_GAME':
      return {
        ...state,
        phase: 'battle',
        opponentBoard: action.opponentBoard,
        opponentShips: action.opponentShips,
        isPlayerTurn: true,
        winner: null,
        ai: createInitialAIState(),
        tracking: createInitialTracking(),
        lastMatchStats: null,
      };

    case 'PLAYER_ATTACK': {
      const newBoard = state.opponentBoard.map(r => r.map(c => ({ ...c })));
      const { row, col } = action.position;
      const newTurn = state.tracking.turnNumber + 1;

      if (action.result === 'miss') {
        newBoard[row][col] = { state: 'miss', shipId: null };
      } else if (action.result === 'hit') {
        newBoard[row][col] = { state: 'hit', shipId: action.shipId || null };
      } else if (action.result === 'sunk') {
        const ship = state.opponentShips.find(s => s.id === action.shipId);
        if (ship) {
          ship.positions.forEach(p => {
            newBoard[p.row][p.col] = { state: 'sunk', shipId: ship.id };
          });
        }
      }

      const newShips = state.opponentShips.map(s => {
        if (s.id === action.shipId) {
          const newHits = s.hits + 1;
          return { ...s, hits: newHits, isSunk: action.result === 'sunk' };
        }
        return s;
      });

      // Update tracking
      const newStreak = action.result !== 'miss'
        ? state.tracking.currentStreak + 1
        : 0;
      const newLongest = Math.max(state.tracking.longestStreak, newStreak);

      const newFirstHit = { ...state.tracking.shipFirstHitTurn };
      if (action.shipId && action.result === 'hit' && !newFirstHit[action.shipId]) {
        newFirstHit[action.shipId] = newTurn;
      }
      // For sunk, if we never recorded first hit (edge: first hit = sunk on size 1? no, min size 2)
      if (action.shipId && action.result === 'sunk' && !newFirstHit[action.shipId]) {
        newFirstHit[action.shipId] = newTurn;
      }

      const newSunkTurn = { ...state.tracking.shipSunkTurn };
      if (action.shipId && action.result === 'sunk') {
        newSunkTurn[action.shipId] = newTurn;
      }

      return {
        ...state,
        opponentBoard: newBoard,
        opponentShips: newShips,
        isPlayerTurn: false,
        tracking: {
          ...state.tracking,
          turnNumber: newTurn,
          playerShots: [
            ...state.tracking.playerShots,
            { turn: newTurn, position: action.position, result: action.result, shipId: action.shipId },
          ],
          currentStreak: newStreak,
          longestStreak: newLongest,
          shipFirstHitTurn: newFirstHit,
          shipSunkTurn: newSunkTurn,
        },
      };
    }

    case 'AI_ATTACK': {
      const newBoard = state.playerBoard.map(r => r.map(c => ({ ...c })));
      const { row, col } = action.position;
      const newTurn = state.tracking.turnNumber + 1;

      if (action.result === 'miss') {
        newBoard[row][col] = { state: 'miss', shipId: null };
      } else if (action.result === 'hit') {
        newBoard[row][col] = { state: 'hit', shipId: action.shipId || null };
      } else if (action.result === 'sunk') {
        const ship = state.playerShips.find(s => s.id === action.shipId);
        if (ship) {
          ship.positions.forEach(p => {
            newBoard[p.row][p.col] = { state: 'sunk', shipId: ship.id };
          });
        }
      }

      const newShips = state.playerShips.map(s => {
        if (s.id === action.shipId) {
          const newHits = s.hits + 1;
          return { ...s, hits: newHits, isSunk: action.result === 'sunk' };
        }
        return s;
      });

      return {
        ...state,
        playerBoard: newBoard,
        playerShips: newShips,
        isPlayerTurn: true,
        ai: action.aiState,
        tracking: {
          ...state.tracking,
          turnNumber: newTurn,
          aiShots: [
            ...state.tracking.aiShots,
            { turn: newTurn, position: action.position, result: action.result, shipId: action.shipId },
          ],
        },
      };
    }

    case 'END_GAME':
      return {
        ...state,
        phase: 'gameOver',
        winner: action.winner,
        lastMatchStats: action.matchStats,
      };

    case 'RESET_GAME':
      return {
        ...state,
        phase: 'placement',
        playerBoard: createEmptyBoard(),
        opponentBoard: createEmptyBoard(),
        playerShips: [],
        opponentShips: [],
        isPlayerTurn: true,
        winner: null,
        ai: createInitialAIState(),
        tracking: createInitialTracking(),
        lastMatchStats: null,
      };

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
