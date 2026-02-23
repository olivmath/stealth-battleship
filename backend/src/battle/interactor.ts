import { MatchRoom, matches, Attack, playerToMatch } from '../matchmaking/entities.js';
import { removeMatch } from '../matchmaking/interactor.js';
import { TURN_TIMEOUT_MS } from './entities.js';

export function submitPlacement(
  match: MatchRoom,
  publicKey: string,
  boardHash: string,
  proof: number[]
): { bothReady: boolean; firstTurn?: string } {
  if (publicKey === match.player1.publicKey) {
    match.player1BoardHash = boardHash;
    match.player1BoardProof = proof;
    match.player1Ready = true;
  } else {
    match.player2BoardHash = boardHash;
    match.player2BoardProof = proof;
    match.player2Ready = true;
  }

  if (match.player1Ready && match.player2Ready) {
    match.status = 'battle';
    match.turnNumber = 1;
    // Player 1 always goes first
    match.currentTurn = match.player1.publicKey;
    return { bothReady: true, firstTurn: match.currentTurn };
  }

  return { bothReady: false };
}

export function processAttack(
  match: MatchRoom,
  attackerKey: string,
  row: number,
  col: number
): { ok: true } | { ok: false; error: string } {
  if (match.status !== 'battle') {
    return { ok: false, error: 'Match not in battle phase' };
  }
  if (match.currentTurn !== attackerKey) {
    return { ok: false, error: 'Not your turn' };
  }
  if (row < 0 || row >= match.gridSize || col < 0 || col >= match.gridSize) {
    return { ok: false, error: 'Invalid coordinates' };
  }

  // Check duplicate attack
  const duplicate = match.attacks.find(
    (a) => a.attacker === attackerKey && a.row === row && a.col === col
  );
  if (duplicate) {
    return { ok: false, error: 'Cell already attacked' };
  }

  return { ok: true };
}

export function recordShotResult(
  match: MatchRoom,
  defenderKey: string,
  row: number,
  col: number,
  result: 'hit' | 'miss'
): void {
  // Find the attacker (the other player)
  const attackerKey = defenderKey === match.player1.publicKey
    ? match.player2!.publicKey
    : match.player1.publicKey;

  match.attacks.push({
    attacker: attackerKey,
    row,
    col,
    result,
    turnNumber: match.turnNumber,
    timestamp: Date.now(),
  });
}

export function advanceTurn(match: MatchRoom): void {
  match.turnNumber++;
  match.currentTurn = match.currentTurn === match.player1.publicKey
    ? match.player2!.publicKey
    : match.player1.publicKey;
}

export function checkWinCondition(
  match: MatchRoom,
  defenderKey: string
): boolean {
  // Count hits against defender
  const hitsAgainstDefender = match.attacks.filter(
    (a) => a.attacker !== defenderKey && a.result === 'hit'
  ).length;

  // Total ship cells = sum of ship sizes
  const totalShipCells = match.shipSizes.reduce((sum, size) => sum + size, 0);

  return hitsAgainstDefender >= totalShipCells;
}

export function endMatch(
  match: MatchRoom,
  winnerKey: string,
  reason: string
): void {
  if (match.turnTimer) clearTimeout(match.turnTimer);
  if (match.defenderTimer) clearTimeout(match.defenderTimer);
  match.status = 'finished';
  match.winner = winnerKey;

  // Clear playerToMatch so both players can start new matches immediately
  // Match object stays in `matches` Map until stale cleanup removes it
  if (match.player1) playerToMatch.delete(match.player1.publicKey);
  if (match.player2) playerToMatch.delete(match.player2.publicKey);
}

export function startTurnTimer(
  match: MatchRoom,
  onTimeout: (match: MatchRoom) => void
): void {
  if (match.turnTimer) clearTimeout(match.turnTimer);

  match.turnTimer = setTimeout(() => {
    if (match.status === 'battle') {
      onTimeout(match);
    }
  }, TURN_TIMEOUT_MS);
}
