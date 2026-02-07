import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, GameAction, Board, PlacedShip } from '../types/game';
import { createEmptyBoard } from '../engine/board';
import { createInitialAIState } from '../engine/ai';

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
  stats: { wins: 0, losses: 0, totalShots: 0, totalHits: 0 },
  shotsFired: 0,
  shotsHit: 0,
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
        shotsFired: 0,
        shotsHit: 0,
      };

    case 'PLAYER_ATTACK': {
      const newBoard = state.opponentBoard.map(r => r.map(c => ({ ...c })));
      const { row, col } = action.position;

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

      return {
        ...state,
        opponentBoard: newBoard,
        opponentShips: newShips,
        isPlayerTurn: false,
        shotsFired: state.shotsFired + 1,
        shotsHit: state.shotsHit + (action.result !== 'miss' ? 1 : 0),
      };
    }

    case 'AI_ATTACK': {
      const newBoard = state.playerBoard.map(r => r.map(c => ({ ...c })));
      const { row, col } = action.position;

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
      };
    }

    case 'END_GAME':
      return {
        ...state,
        phase: 'gameOver',
        winner: action.winner,
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
        shotsFired: 0,
        shotsHit: 0,
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
