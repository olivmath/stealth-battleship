import React, { createContext, useContext, useReducer, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameState, GameAction, BattleTracking, PlacedShip, Position, Orientation, AttackResult, DifficultyLevel, GameCommitment, ZKCommitment } from '../shared/entities';
import { turnsProof, toShipTuples, toAttackTuples } from '../zk';
import { createEmptyBoard, createInitialAIState } from './engine';
import { computeMatchStats } from '../stats/interactor';
import { updateStatsAfterGame, saveMatchToHistory } from '../stats/adapter';
import { getPlayerName, savePlayerName } from './adapter';
import { IGameRepository, StartGameUseCase, PlaceShipUseCase, AttackUseCase } from './interactor';

class InMemoryGameRepository implements IGameRepository {
  private state: GameState | null = null;
  async saveGameState(state: GameState): Promise<void> { this.state = state; }
  async getGameState(): Promise<GameState | null> { return this.state; }
  async resetGame(): Promise<void> { this.state = null; }
}

function createInitialTracking(): BattleTracking {
  return {
    turnNumber: 0, playerShots: [], opponentShots: [],
    currentStreak: 0, longestStreak: 0, opponentStreak: 0, opponentLongestStreak: 0,
    shipFirstHitTurn: {}, shipSunkTurn: {},
  };
}

const initialState: GameState = {
  playerName: '', phase: 'login',
  playerBoard: createEmptyBoard(), opponentBoard: createEmptyBoard(),
  playerShips: [], opponentShips: [],
  isPlayerTurn: true, winner: null,
  opponent: createInitialAIState(),
  stats: { wins: 0, losses: 0, totalShots: 0, totalHits: 0, totalXP: 0 },
  tracking: createInitialTracking(),
  lastMatchStats: null,
  settings: { gridSize: 10, difficulty: 'hard' },
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER':
      return { ...state, playerName: action.name, phase: 'menu' };
    case 'LOAD_STATS':
      return { ...state, stats: action.stats };
    case 'LOAD_SETTINGS':
      return { ...state, settings: action.settings };
    case 'PLACE_SHIP': {
      const newBoard = state.playerBoard.map(r => r.map(c => ({ ...c })));
      action.ship.positions.forEach(p => {
        newBoard[p.row][p.col] = { state: 'ship', shipId: action.ship.id };
      });
      return { ...state, playerBoard: newBoard, playerShips: [...state.playerShips, action.ship] };
    }
    case 'REMOVE_SHIP': {
      const ship = state.playerShips.find(s => s.id === action.shipId);
      if (!ship) return state;
      const newBoard = state.playerBoard.map(r => r.map(c => ({ ...c })));
      ship.positions.forEach(p => {
        newBoard[p.row][p.col] = { state: 'empty', shipId: null };
      });
      return { ...state, playerBoard: newBoard, playerShips: state.playerShips.filter(s => s.id !== action.shipId) };
    }
    case 'START_GAME':
      return {
        ...state, phase: 'battle',
        opponentBoard: action.opponentBoard, opponentShips: action.opponentShips,
        isPlayerTurn: true, winner: null, opponent: createInitialAIState(),
        tracking: createInitialTracking(), lastMatchStats: null, commitment: action.commitment,
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
        if (ship) ship.positions.forEach(p => { newBoard[p.row][p.col] = { state: 'sunk', shipId: ship.id }; });
      }
      const newShips = state.opponentShips.map(s => {
        if (s.id === action.shipId) { const h = s.hits + 1; return { ...s, hits: h, isSunk: action.result === 'sunk' }; }
        return s;
      });
      const newStreak = action.result !== 'miss' ? state.tracking.currentStreak + 1 : 0;
      const newLongest = Math.max(state.tracking.longestStreak, newStreak);
      const newFirstHit = { ...state.tracking.shipFirstHitTurn };
      if (action.shipId && (action.result === 'hit' || action.result === 'sunk') && !newFirstHit[action.shipId]) newFirstHit[action.shipId] = newTurn;
      const newSunkTurn = { ...state.tracking.shipSunkTurn };
      if (action.shipId && action.result === 'sunk') newSunkTurn[action.shipId] = newTurn;
      return {
        ...state, opponentBoard: newBoard, opponentShips: newShips, isPlayerTurn: false,
        tracking: { ...state.tracking, turnNumber: newTurn, playerShots: [...state.tracking.playerShots, { turn: newTurn, position: action.position, result: action.result, shipId: action.shipId }], currentStreak: newStreak, longestStreak: newLongest, shipFirstHitTurn: newFirstHit, shipSunkTurn: newSunkTurn },
      };
    }
    case 'OPPONENT_ATTACK': {
      const newBoard = state.playerBoard.map(r => r.map(c => ({ ...c })));
      const { row, col } = action.position;
      const newTurn = state.tracking.turnNumber + 1;
      if (action.result === 'miss') newBoard[row][col] = { state: 'miss', shipId: null };
      else if (action.result === 'hit') newBoard[row][col] = { state: 'hit', shipId: action.shipId || null };
      else if (action.result === 'sunk') {
        const ship = state.playerShips.find(s => s.id === action.shipId);
        if (ship) ship.positions.forEach(p => { newBoard[p.row][p.col] = { state: 'sunk', shipId: ship.id }; });
      }
      const newShips = state.playerShips.map(s => {
        if (s.id === action.shipId) { const h = s.hits + 1; return { ...s, hits: h, isSunk: action.result === 'sunk' }; }
        return s;
      });
      const oppStreak = action.result !== 'miss' ? state.tracking.opponentStreak + 1 : 0;
      const oppLongest = Math.max(state.tracking.opponentLongestStreak, oppStreak);
      return {
        ...state, playerBoard: newBoard, playerShips: newShips, isPlayerTurn: true, ...(action.opponentState ? { opponent: action.opponentState } : {}),
        tracking: { ...state.tracking, turnNumber: newTurn, opponentShots: [...state.tracking.opponentShots, { turn: newTurn, position: action.position, result: action.result, shipId: action.shipId }], opponentStreak: oppStreak, opponentLongestStreak: oppLongest },
      };
    }
    case 'END_GAME':
      return { ...state, phase: 'gameOver', winner: action.winner, lastMatchStats: action.matchStats };
    case 'RESET_GAME': {
      const gs = state.settings.gridSize;
      return {
        ...state, phase: 'placement',
        playerBoard: createEmptyBoard(gs), opponentBoard: createEmptyBoard(gs),
        playerShips: [], opponentShips: [], isPlayerTurn: true, winner: null,
        opponent: createInitialAIState(), tracking: createInitialTracking(), lastMatchStats: null,
      };
    }
    default: return state;
  }
}

interface GameContextType { state: GameState; dispatch: React.Dispatch<GameAction>; }

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}

const gameRepository: IGameRepository = new InMemoryGameRepository();

export const gameContainer = {
  start: new StartGameUseCase(gameRepository),
  placeShip: new PlaceShipUseCase(gameRepository),
  attack: new AttackUseCase(gameRepository),
  repository: gameRepository,
};

export class GameModule {
  private static instance: GameModule;
  public readonly start: StartGameUseCase;
  public readonly placeShip: PlaceShipUseCase;
  public readonly attack: AttackUseCase;
  public readonly repository: IGameRepository;
  private constructor() {
    this.repository = new InMemoryGameRepository();
    this.start = new StartGameUseCase(this.repository);
    this.placeShip = new PlaceShipUseCase(this.repository);
    this.attack = new AttackUseCase(this.repository);
  }
  public static getInstance(): GameModule {
    if (!GameModule.instance) GameModule.instance = new GameModule();
    return GameModule.instance;
  }
}

export function useGameController() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const module = GameModule.getInstance();
  const loadState = useCallback(async () => {
    const state = await module.repository.getGameState();
    setGameState(state);
  }, []);
  const placeShipAction = async (ship: any, pos: Position, orientation: Orientation) => {
    try {
      const result = await module.placeShip.execute(ship, pos, orientation);
      if (result) await loadState(); else setError('Invalid placement');
    } catch (e) { setError(e instanceof Error ? e.message : 'Error placing ship'); }
  };
  const attack = async (pos: Position): Promise<AttackResult | null> => {
    try {
      const result = await module.attack.execute(pos);
      if (result) await loadState();
      return result;
    } catch (e) { setError(e instanceof Error ? e.message : 'Error attacking'); return null; }
  };
  useEffect(() => { loadState(); }, [loadState]);
  return { gameState, placeShip: placeShipAction, attack, error, clearError: () => setError(null) };
}

interface EndGameParams {
  won: boolean; tracking: BattleTracking; opponentShips: PlacedShip[]; playerShips: PlacedShip[];
  gridSize: number; difficulty: DifficultyLevel; navigateTo: string; commitment?: GameCommitment;
}

let turnsProofPromiseRef: Promise<void> | null = null;

export function useGameEffects() {
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const endGame = useCallback(({
    won, tracking, opponentShips, playerShips, gridSize, difficulty, navigateTo, commitment,
  }: EndGameParams) => {
    const matchStats = computeMatchStats(tracking, opponentShips, playerShips, won, gridSize, difficulty);
    dispatch({ type: 'END_GAME', winner: won ? 'player' : 'opponent', matchStats });
    updateStatsAfterGame(won, matchStats);
    saveMatchToHistory(won, matchStats, gridSize, difficulty, commitment);
    if (commitment?.playerZk && commitment?.opponentZk) {
      console.log('[ZK] === TURNS PROOF START (background) ===');
      turnsProofPromiseRef = turnsProof({
        shipsPlayer: toShipTuples(playerShips), shipsAi: toShipTuples(opponentShips),
        noncePlayer: commitment.playerZk.nonce, nonceAi: commitment.opponentZk.nonce,
        boardHashPlayer: commitment.playerZk.boardHash, boardHashAi: commitment.opponentZk.boardHash,
        attacksPlayer: toAttackTuples(tracking.playerShots), attacksAi: toAttackTuples(tracking.opponentShots),
        shipSizes: [5, 4, 3, 3, 2], winner: won ? 0 : 1,
      }).then((result) => {
        console.log(`[ZK] turnsProof OK — ${result.proof.length} bytes, winner=${result.winner}`);
      }).catch((err: any) => {
        console.warn('[ZK] turnsProof FAILED:', err.message);
      }).finally(() => { turnsProofPromiseRef = null; });
    } else { turnsProofPromiseRef = null; }
    navigate(navigateTo, { replace: true });
  }, [dispatch, navigate]);
  return { endGame };
}

export async function waitForTurnsProof(): Promise<void> {
  if (turnsProofPromiseRef) await turnsProofPromiseRef;
}

export function usePlayerName() {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getPlayerName().then(n => { setName(n); setLoading(false); }); }, []);
  const save = useCallback(async (newName: string) => { await savePlayerName(newName); setName(newName); }, []);
  return { name, loading, save };
}
