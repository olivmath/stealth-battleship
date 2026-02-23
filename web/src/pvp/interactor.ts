// PvP interactor — game logic orchestration

import { connect, disconnect, getSocket, getKeys, waitForConnection } from './adapter';
import { signAction, SignerKeys } from './signer';
import type { PvPMatch, PvPPhase, PvPIncomingAttack, PvPResultConfirmed, PvPGameOver } from './entities';

const TAG = '[PvP:interactor]';

export interface PvPCallbacks {
  onPhaseChange: (phase: PvPPhase) => void;
  onMatchFound: (match: { matchId: string; opponent: string; gridSize: number; matchCode?: string }) => void;
  onOpponentReady: () => void;
  onBothReady: (firstTurn: string) => void;
  onIncomingAttack: (attack: PvPIncomingAttack) => void;
  onResultConfirmed: (result: PvPResultConfirmed) => void;
  onTurnStart: (data: { currentTurn: string; turnNumber: number; deadline: number }) => void;
  onGameOver: (data: PvPGameOver) => void;
  onOpponentForfeit: (reason: string) => void;
  onError: (message: string) => void;
}

let callbacks: PvPCallbacks | null = null;

export function initPvP(keys: SignerKeys, cbs: PvPCallbacks): void {
  callbacks = cbs;
  console.debug(TAG, 'Initializing PvP...');
  const socket = connect(keys);

  socket.on('connect', () => {
    console.debug(TAG, 'Socket connected, id:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error(TAG, 'Connection error:', err.message);
    cbs.onError(err.message);
    cbs.onPhaseChange('error');
  });

  socket.on('disconnect', (reason) => {
    console.warn(TAG, 'Disconnected:', reason);
    if (reason === 'io server disconnect') {
      cbs.onError('Server disconnected');
      cbs.onPhaseChange('error');
    } else {
      cbs.onPhaseChange('reconnecting');
    }
  });

  // Matchmaking events
  socket.on('match:searching', () => {
    console.debug(TAG, 'Event: match:searching');
    cbs.onPhaseChange('searching');
  });

  socket.on('match:found', (data) => {
    console.debug(TAG, 'Event: match:found', { matchId: data.matchId, opponent: data.opponent?.slice(0, 12), gridSize: data.gridSize });
    cbs.onMatchFound(data);
    cbs.onPhaseChange('placing');
  });

  socket.on('match:friend_created', (data) => {
    console.debug(TAG, 'Event: match:friend_created', { matchId: data.matchId, matchCode: data.matchCode });
    cbs.onMatchFound({ matchId: data.matchId, opponent: '', gridSize: 10, matchCode: data.matchCode });
  });

  socket.on('match:friend_joined', (data) => {
    console.debug(TAG, 'Event: match:friend_joined', { matchId: data.matchId, opponent: data.opponent?.slice(0, 12) });
    cbs.onMatchFound(data);
    cbs.onPhaseChange('placing');
  });

  socket.on('match:search_cancelled', () => {
    console.debug(TAG, 'Event: match:search_cancelled');
    cbs.onPhaseChange('idle');
  });

  socket.on('match:error', (data) => {
    console.error(TAG, 'Event: match:error', data);
    cbs.onError(data.message);
  });

  // Placement events
  socket.on('placement:opponent_ready', () => {
    console.debug(TAG, 'Event: placement:opponent_ready');
    cbs.onOpponentReady();
  });

  socket.on('placement:both_ready', (data) => {
    console.debug(TAG, 'Event: placement:both_ready', { firstTurn: data.firstTurn?.slice(0, 12) });
    cbs.onBothReady(data.firstTurn);
    cbs.onPhaseChange('battle');
  });

  socket.on('placement:error', (data) => {
    console.error(TAG, 'Event: placement:error', data);
    cbs.onError(data.message);
  });

  // Battle events
  socket.on('battle:incoming_attack', (data) => {
    console.debug(TAG, 'Event: battle:incoming_attack', data);
    cbs.onIncomingAttack(data);
  });

  socket.on('battle:result_confirmed', (data) => {
    console.debug(TAG, 'Event: battle:result_confirmed', data);
    cbs.onResultConfirmed(data);
  });

  socket.on('battle:turn_start', (data) => {
    console.debug(TAG, 'Event: battle:turn_start', { currentTurn: data.currentTurn?.slice(0, 12), turn: data.turnNumber });
    cbs.onTurnStart(data);
  });

  socket.on('battle:game_over', (data) => {
    console.debug(TAG, 'Event: battle:game_over', data);
    cbs.onGameOver(data);
    cbs.onPhaseChange('finished');
  });

  socket.on('battle:opponent_forfeit', (data) => {
    console.warn(TAG, 'Event: battle:opponent_forfeit', data);
    cbs.onOpponentForfeit(data.reason);
  });

  socket.on('battle:error', (data) => {
    console.error(TAG, 'Event: battle:error', data);
    cbs.onError(data.message);
  });
}

export function findRandomMatch(gridSize: number): void {
  console.debug(TAG, `Emit: match:find_random (${gridSize}x${gridSize})`);
  waitForConnection().then(s => s.emit('match:find_random', { gridSize }))
    .catch(err => { console.error(TAG, 'findRandomMatch failed:', err.message); callbacks?.onError(err.message); });
}

export function cancelSearch(): void {
  console.debug(TAG, 'Emit: match:cancel_search');
  getSocket()?.emit('match:cancel_search');
}

export function createFriendMatch(gridSize: number): void {
  console.debug(TAG, `Emit: match:create_friend (${gridSize}x${gridSize})`);
  waitForConnection().then(s => s.emit('match:create_friend', { gridSize }))
    .catch(err => { console.error(TAG, 'createFriendMatch failed:', err.message); callbacks?.onError(err.message); });
}

export function joinFriendMatch(matchCode: string): void {
  console.debug(TAG, 'Emit: match:join_friend', matchCode);
  waitForConnection().then(s => s.emit('match:join_friend', { matchCode }))
    .catch(err => { console.error(TAG, 'joinFriendMatch failed:', err.message); callbacks?.onError(err.message); });
}

export function submitPlacement(matchId: string, boardHash: string, proof: number[]): void {
  const keys = getKeys();
  if (!keys) {
    console.error(TAG, 'submitPlacement: no keys available');
    return;
  }

  const { timestamp, signature } = signAction(keys, 'placement:ready', { matchId, boardHash });
  console.debug(TAG, 'Emit: placement:ready', { matchId: matchId.slice(0, 8), boardHash: boardHash.slice(0, 12), proofLen: proof.length });

  getSocket()?.emit('placement:ready', {
    matchId,
    boardHash,
    proof,
    timestamp,
    signature,
  });
}

export function sendAttack(matchId: string, row: number, col: number): void {
  const keys = getKeys();
  if (!keys) {
    console.error(TAG, 'sendAttack: no keys available');
    return;
  }

  const { timestamp, signature } = signAction(keys, 'battle:attack', { matchId, row, col });
  console.debug(TAG, `Emit: battle:attack (${row},${col}) turn matchId:${matchId.slice(0, 8)}`);

  getSocket()?.emit('battle:attack', {
    matchId,
    row,
    col,
    timestamp,
    signature,
  });
}

export function sendShotResult(
  matchId: string,
  row: number,
  col: number,
  result: 'hit' | 'miss',
  proof: number[]
): void {
  const keys = getKeys();
  if (!keys) {
    console.error(TAG, 'sendShotResult: no keys available');
    return;
  }

  const { timestamp, signature } = signAction(keys, 'battle:shot_result', { matchId, row, col, result });
  console.debug(TAG, `Emit: battle:shot_result (${row},${col}) = ${result}`);

  getSocket()?.emit('battle:shot_result', {
    matchId,
    row,
    col,
    result,
    proof,
    timestamp,
    signature,
  });
}

export function sendForfeit(matchId: string): void {
  console.debug(TAG, 'Emit: battle:forfeit', matchId.slice(0, 8));
  getSocket()?.emit('battle:forfeit', { matchId });
}

export function cleanupPvP(): void {
  console.debug(TAG, 'Cleanup');
  disconnect();
  callbacks = null;
}
