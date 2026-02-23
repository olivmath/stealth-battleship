import crypto from 'crypto';
import {
  MatchRoom, QueueEntry, matches, playerToMatch,
  matchQueue, matchCodeIndex, getShipSizes,
} from './entities.js';

function generateId(): string {
  return crypto.randomBytes(8).toString('hex');
}

function generateMatchCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function findRandomMatch(
  publicKey: string,
  socketId: string,
  gridSize: number
): { type: 'queued' } | { type: 'matched'; match: MatchRoom } {
  // Check if already in a match
  if (playerToMatch.has(publicKey)) {
    return { type: 'queued' }; // already busy
  }

  // Check if already in queue — prevent duplicate entries
  const alreadyQueued = matchQueue.some((e) => e.publicKey === publicKey);
  if (alreadyQueued) {
    return { type: 'queued' };
  }

  // Find compatible player in queue
  const idx = matchQueue.findIndex(
    (e) => e.gridSize === gridSize && e.publicKey !== publicKey
  );

  if (idx === -1) {
    // No match found — add to queue
    matchQueue.push({ publicKey, socketId, gridSize, joinedAt: Date.now() });
    return { type: 'queued' };
  }

  // Found opponent — remove from queue
  const opponent = matchQueue.splice(idx, 1)[0];
  const match = createMatch(
    { publicKey, socketId },
    { publicKey: opponent.publicKey, socketId: opponent.socketId },
    gridSize
  );

  return { type: 'matched', match };
}

export function cancelSearch(publicKey: string): boolean {
  const idx = matchQueue.findIndex((e) => e.publicKey === publicKey);
  if (idx !== -1) {
    matchQueue.splice(idx, 1);
    return true;
  }
  return false;
}

export function createFriendMatch(
  publicKey: string,
  socketId: string,
  gridSize: number
): { matchId: string; matchCode: string } {
  const matchId = generateId();
  const matchCode = generateMatchCode();

  const match: MatchRoom = {
    id: matchId,
    status: 'waiting',
    gridSize,
    matchCode,
    player1: { publicKey, socketId },
    player1Ready: false,
    player2Ready: false,
    turnNumber: 0,
    attacks: [],
    shipSizes: getShipSizes(gridSize),
    createdAt: Date.now(),
  };

  matches.set(matchId, match);
  playerToMatch.set(publicKey, matchId);
  matchCodeIndex.set(matchCode, matchId);

  return { matchId, matchCode };
}

export function joinFriendMatch(
  matchCode: string,
  publicKey: string,
  socketId: string
): { ok: true; match: MatchRoom } | { ok: false; error: string } {
  const matchId = matchCodeIndex.get(matchCode);
  if (!matchId) return { ok: false, error: 'Match not found' };

  const match = matches.get(matchId);
  if (!match) return { ok: false, error: 'Match not found' };
  if (match.status !== 'waiting') return { ok: false, error: 'Match already started' };
  if (match.player1.publicKey === publicKey) return { ok: false, error: 'Cannot join your own match' };

  match.player2 = { publicKey, socketId };
  match.status = 'placing';
  playerToMatch.set(publicKey, matchId);
  matchCodeIndex.delete(matchCode); // code no longer valid

  return { ok: true, match };
}

function createMatch(
  p1: { publicKey: string; socketId: string },
  p2: { publicKey: string; socketId: string },
  gridSize: number
): MatchRoom {
  const matchId = generateId();
  const match: MatchRoom = {
    id: matchId,
    status: 'placing',
    gridSize,
    player1: p1,
    player2: p2,
    player1Ready: false,
    player2Ready: false,
    turnNumber: 0,
    attacks: [],
    shipSizes: getShipSizes(gridSize),
    createdAt: Date.now(),
  };

  matches.set(matchId, match);
  playerToMatch.set(p1.publicKey, matchId);
  playerToMatch.set(p2.publicKey, matchId);

  return match;
}

export function getMatch(matchId: string): MatchRoom | undefined {
  return matches.get(matchId);
}

export function getPlayerMatch(publicKey: string): MatchRoom | undefined {
  const matchId = playerToMatch.get(publicKey);
  if (!matchId) return undefined;
  return matches.get(matchId);
}

export function removeMatch(matchId: string): void {
  const match = matches.get(matchId);
  if (!match) return;

  if (match.turnTimer) clearTimeout(match.turnTimer);
  if (match.player1) playerToMatch.delete(match.player1.publicKey);
  if (match.player2) playerToMatch.delete(match.player2.publicKey);
  if (match.matchCode) matchCodeIndex.delete(match.matchCode);
  matches.delete(matchId);
}
