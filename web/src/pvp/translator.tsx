import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import type { PvPPhase, PvPMatch, PvPIncomingAttack, PvPResultConfirmed, PvPGameOver } from './entities';
import { deriveSignerKeys, stellarPublicToHex, SignerKeys } from './signer';
import {
  initPvP, cleanupPvP,
  findRandomMatch as doFindRandom,
  cancelSearch as doCancelSearch,
  createFriendMatch as doCreateFriend,
  joinFriendMatch as doJoinFriend,
  submitPlacement as doSubmitPlacement,
  sendAttack as doSendAttack,
  sendShotResult as doSendShotResult,
  sendReveal as doSendReveal,
  sendForfeit as doSendForfeit,
} from './interactor';

interface PvPState {
  phase: PvPPhase;
  match: PvPMatch | null;
  matchCode: string | null;
  myPublicKeyHex: string | null;
  opponentReady: boolean;
  lastIncomingAttack: PvPIncomingAttack | null;
  lastResultConfirmed: PvPResultConfirmed | null;
  gameOver: PvPGameOver | null;
  error: string | null;
}

interface PvPContextValue extends PvPState {
  connectWithSecret: (stellarSecret: string) => void;
  findRandomMatch: (gridSize: number) => void;
  cancelSearch: () => void;
  createFriendMatch: (gridSize: number) => void;
  joinFriendMatch: (matchCode: string) => void;
  submitPlacement: (boardHash: string, proof: number[]) => void;
  attack: (row: number, col: number) => void;
  respondShotResult: (row: number, col: number, result: 'hit' | 'miss', proof: number[], sunkShipName?: string, sunkShipSize?: number) => void;
  sendReveal: (matchId: string, ships: any[], nonce: string) => void;
  forfeit: () => void;
  reset: () => void;
}

const initialState: PvPState = {
  phase: 'idle',
  match: null,
  matchCode: null,
  myPublicKeyHex: null,
  opponentReady: false,
  lastIncomingAttack: null,
  lastResultConfirmed: null,
  gameOver: null,
  error: null,
};

const TAG = '[PvP:translator]';
const PvPContext = createContext<PvPContextValue | null>(null);

export function PvPProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PvPState>(initialState);
  const keysRef = useRef<SignerKeys | null>(null);

  const connectWithSecret = useCallback((stellarSecret: string) => {
    const keys = deriveSignerKeys(stellarSecret);
    keysRef.current = keys;
    console.debug(TAG, 'connectWithSecret, pubKey:', keys.publicKeyHex.slice(0, 12) + '...');
    setState(s => ({ ...s, myPublicKeyHex: keys.publicKeyHex, phase: 'connecting' }));

    initPvP(keys, {
      onPhaseChange: (phase) => {
        console.debug(TAG, 'Phase →', phase);
        setState(s => ({ ...s, phase }));
      },
      onMatchFound: (data) => {
        const matchId = data?.matchId || '';
        const shortId = matchId.slice(0, 8);
        console.debug(TAG, 'Match found →', { matchId: shortId, opponent: data.opponent?.slice(0, 12), gridSize: data.gridSize });
        setState(s => ({
          ...s,
          match: {
            matchId: matchId,
            opponentKey: data.opponent,
            gridSize: data.gridSize,
            phase: 'placing',
            isMyTurn: false,
            turnNumber: 0,
          },
          matchCode: data.matchCode || s.matchCode,
          phase: data.opponent ? 'placing' : s.phase,
        }));
      },
      onOpponentReady: () => {
        console.debug(TAG, 'Opponent ready');
        setState(s => ({ ...s, opponentReady: true }));
      },
      onBothReady: (firstTurn) => {
        console.debug(TAG, 'Both ready! firstTurn:', firstTurn?.slice(0, 12));
        setState(s => ({
          ...s,
          phase: 'battle',
          match: s.match ? {
            ...s.match,
            phase: 'battle',
            isMyTurn: firstTurn === s.myPublicKeyHex,
            turnNumber: 1,
          } : null,
        }));
      },
      onIncomingAttack: (attack) => {
        console.debug(TAG, 'Incoming attack →', attack);
        setState(s => ({ ...s, lastIncomingAttack: attack }));
      },
      onResultConfirmed: (result) => {
        console.debug(TAG, 'Result confirmed →', result);
        setState(s => ({ ...s, lastResultConfirmed: result }));
      },
      onTurnStart: (data) => {
        console.debug(TAG, 'Turn start →', { turn: data.turnNumber, currentTurn: data.currentTurn?.slice(0, 12) });
        setState(s => ({
          ...s,
          match: s.match ? {
            ...s.match,
            isMyTurn: data.currentTurn === s.myPublicKeyHex,
            turnNumber: data.turnNumber,
            turnDeadline: data.deadline,
          } : null,
        }));
      },
      onGameOver: (data) => {
        console.debug(TAG, 'Game over →', data);
        setState(s => ({
          ...s,
          gameOver: data,
          phase: 'finished',
          match: s.match ? { ...s.match, phase: 'finished', winner: data.winner, winReason: data.reason } : null,
        }));
      },
      onOpponentForfeit: (reason) => {
        console.warn(TAG, 'Opponent forfeit:', reason);
        setState(s => ({ ...s, error: `Opponent forfeited: ${reason}` }));
      },
      onError: (message) => {
        console.error(TAG, 'Error:', message);
        setState(s => ({ ...s, error: message }));
      },
    });
  }, []);

  const findRandomMatch = useCallback((gridSize: number) => {
    setState(s => ({ ...s, phase: 'searching', error: null }));
    doFindRandom(gridSize);
  }, []);

  const cancelSearch = useCallback(() => {
    doCancelSearch();
    setState(s => ({ ...s, phase: 'idle' }));
  }, []);

  const createFriendMatch = useCallback((gridSize: number) => {
    setState(s => ({ ...s, phase: 'searching', error: null }));
    doCreateFriend(gridSize);
  }, []);

  const joinFriendMatch = useCallback((matchCode: string) => {
    setState(s => ({ ...s, phase: 'connecting', error: null }));
    doJoinFriend(matchCode);
  }, []);

  const submitPlacement = useCallback((boardHash: string, proof: number[]) => {
    if (!state.match) return;
    doSubmitPlacement(state.match.matchId, boardHash, proof);
    setState(s => ({ ...s, phase: 'waiting_opponent' }));
  }, [state.match]);

  const attack = useCallback((row: number, col: number) => {
    if (!state.match) return;
    doSendAttack(state.match.matchId, row, col);
  }, [state.match]);

  const respondShotResult = useCallback((row: number, col: number, result: 'hit' | 'miss', proof: number[], sunkShipName?: string, sunkShipSize?: number) => {
    if (!state.match) return;
    doSendShotResult(state.match.matchId, row, col, result, proof, sunkShipName, sunkShipSize);
  }, [state.match]);

  const sendReveal = useCallback((matchId: string, ships: any[], nonce: string) => {
    doSendReveal(matchId, ships, nonce);
  }, []);

  const forfeit = useCallback(() => {
    if (!state.match) return;
    doSendForfeit(state.match.matchId);
  }, [state.match]);

  const reset = useCallback(() => {
    cleanupPvP();
    setState(initialState);
    keysRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupPvP();
    };
  }, []);

  return (
    <PvPContext.Provider value={{
      ...state,
      connectWithSecret,
      findRandomMatch,
      cancelSearch,
      createFriendMatch,
      joinFriendMatch,
      submitPlacement,
      attack,
      respondShotResult,
      sendReveal,
      forfeit,
      reset,
    }}>
      {children}
    </PvPContext.Provider>
  );
}

export function usePvP(): PvPContextValue {
  const ctx = useContext(PvPContext);
  if (!ctx) throw new Error('usePvP must be used within PvPProvider');
  return ctx;
}
