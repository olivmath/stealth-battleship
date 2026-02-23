import { Server, Socket } from 'socket.io';
import { getMatch, getPlayerMatch } from '../matchmaking/interactor.js';
import { verifyAction } from '../auth/verifier.js';
import {
  submitPlacement, processAttack, recordShotResult,
  advanceTurn, checkWinCondition, endMatch, startTurnTimer,
} from './interactor.js';
import {
  PlacementReadyPayload, AttackPayload, ShotResultPayload, ForfeitPayload,
  TURN_TIMEOUT_MS, DEFENDER_RESPONSE_TIMEOUT_MS,
} from './entities.js';
import { c } from '../log.js';

function getOpponentSocketId(
  match: { player1: { publicKey: string; socketId: string }; player2?: { publicKey: string; socketId: string } },
  myKey: string
): string | null {
  if (myKey === match.player1.publicKey) return match.player2?.socketId || null;
  return match.player1.socketId;
}

export function registerBattleHandlers(
  io: Server,
  socket: Socket,
  checkRateLimit?: (socketId: string) => boolean
): void {
  const publicKey = (socket.data as { publicKey: string }).publicKey;
  const shortKey = publicKey.slice(0, 8);

  // ─── Placement Ready ───
  socket.on('placement:ready', (data: PlacementReadyPayload) => {
    const match = getMatch(data.matchId);
    if (!match || match.status !== 'placing') {
      socket.emit('placement:error', { message: 'Invalid match or phase' });
      return;
    }

    // Verify action signature
    const authResult = verifyAction({
      publicKey,
      action: 'placement:ready',
      data: JSON.stringify({ matchId: data.matchId, boardHash: data.boardHash }),
      timestamp: data.timestamp,
      signature: data.signature,
    });
    if (!authResult.valid) {
      socket.emit('placement:error', { message: 'Invalid signature' });
      return;
    }

    // TODO: Verify board_validity proof server-side (requires loading circuit)
    // For now, accept the proof and hash
    console.log(c.blue('[battle]') + ` ${shortKey}... placement ready (hash: ${data.boardHash.slice(0, 12)}...)`);

    const result = submitPlacement(match, publicKey, data.boardHash, data.proof);
    const opponentId = getOpponentSocketId(match, publicKey);

    if (opponentId) {
      io.to(opponentId).emit('placement:opponent_ready');
    }

    if (result.bothReady) {
      // Both ready — start battle
      io.to(match.player1.socketId).emit('placement:both_ready', {
        firstTurn: result.firstTurn,
      });
      io.to(match.player2!.socketId).emit('placement:both_ready', {
        firstTurn: result.firstTurn,
      });

      // Emit first turn
      emitTurnStart(io, match);
      console.log(c.blue('[battle]') + ` Match ${c.boldGreen(match.id)} — BATTLE START`);
    }
  });

  // ─── Attack ───
  socket.on('battle:attack', (data: AttackPayload) => {
    // Rate limit check
    if (checkRateLimit && !checkRateLimit(socket.id)) {
      socket.emit('battle:error', { message: 'Rate limited — max 1 attack/second' });
      return;
    }

    const match = getMatch(data.matchId);
    if (!match) {
      socket.emit('battle:error', { message: 'Match not found' });
      return;
    }

    // Verify action signature
    const authResult = verifyAction({
      publicKey,
      action: 'battle:attack',
      data: JSON.stringify({ matchId: data.matchId, row: data.row, col: data.col }),
      timestamp: data.timestamp,
      signature: data.signature,
    });
    if (!authResult.valid) {
      socket.emit('battle:error', { message: 'Invalid signature' });
      return;
    }

    const result = processAttack(match, publicKey, data.row, data.col);
    if (!result.ok) {
      socket.emit('battle:error', { message: result.error });
      return;
    }

    // Clear turn timer while waiting for defender response
    if (match.turnTimer) clearTimeout(match.turnTimer);

    // Forward attack to defender
    const defenderSocketId = getOpponentSocketId(match, publicKey);
    if (defenderSocketId) {
      io.to(defenderSocketId).emit('battle:incoming_attack', {
        row: data.row,
        col: data.col,
        turnNumber: match.turnNumber,
      });
    }

    // Start defender response timeout
    if (match.defenderTimer) clearTimeout(match.defenderTimer);
    match.defenderTimer = setTimeout(() => {
      if (match.status !== 'battle') return;
      // Defender didn't respond — attacker wins
      endMatch(match, publicKey, 'defender_timeout');
      io.to(match.player1.socketId).emit('battle:game_over', {
        winner: publicKey,
        reason: 'defender_timeout',
        turnNumber: match.turnNumber,
      });
      io.to(match.player2!.socketId).emit('battle:game_over', {
        winner: publicKey,
        reason: 'defender_timeout',
        turnNumber: match.turnNumber,
      });
      console.log(c.yellow('[battle]') + ` Match ${match.id} — DEFENDER TIMEOUT`);
    }, DEFENDER_RESPONSE_TIMEOUT_MS);

    console.log(c.blue('[battle]') + ` ${shortKey}... attacks (${data.row},${data.col})`);
  });

  // ─── Shot Result (from defender) ───
  socket.on('battle:shot_result', (data: ShotResultPayload) => {
    const match = getMatch(data.matchId);
    if (!match || match.status !== 'battle') {
      socket.emit('battle:error', { message: 'Invalid match or phase' });
      return;
    }

    // Verify action signature
    const authResult = verifyAction({
      publicKey,
      action: 'battle:shot_result',
      data: JSON.stringify({ matchId: data.matchId, row: data.row, col: data.col, result: data.result }),
      timestamp: data.timestamp,
      signature: data.signature,
    });
    if (!authResult.valid) {
      socket.emit('battle:error', { message: 'Invalid signature' });
      return;
    }

    // Clear defender response timer
    if (match.defenderTimer) {
      clearTimeout(match.defenderTimer);
      match.defenderTimer = undefined;
    }

    // TODO: Verify shot_proof server-side
    // For now, trust the proof and record result

    recordShotResult(match, publicKey, data.row, data.col, data.result);

    // Notify attacker of confirmed result
    const attackerSocketId = getOpponentSocketId(match, publicKey);
    if (attackerSocketId) {
      io.to(attackerSocketId).emit('battle:result_confirmed', {
        row: data.row,
        col: data.col,
        result: data.result,
        turnNumber: match.turnNumber,
      });
    }

    console.log(c.blue('[battle]') + ` ${shortKey}... responds: ${data.result} at (${data.row},${data.col})`);

    // Check win condition
    const attackerKey = publicKey === match.player1.publicKey
      ? match.player2!.publicKey
      : match.player1.publicKey;

    if (checkWinCondition(match, publicKey)) {
      endMatch(match, attackerKey, 'all_ships_sunk');
      io.to(match.player1.socketId).emit('battle:game_over', {
        winner: attackerKey,
        reason: 'all_ships_sunk',
        turnNumber: match.turnNumber,
      });
      io.to(match.player2!.socketId).emit('battle:game_over', {
        winner: attackerKey,
        reason: 'all_ships_sunk',
        turnNumber: match.turnNumber,
      });
      console.log(c.boldGreen('[battle]') + ` Match ${match.id} — WINNER: ${attackerKey.slice(0, 8)}...`);
      return;
    }

    // Advance turn
    advanceTurn(match);
    emitTurnStart(io, match);
  });

  // ─── Forfeit ───
  socket.on('battle:forfeit', (data: ForfeitPayload) => {
    const match = getMatch(data.matchId);
    if (!match || match.status === 'finished') return;

    const winnerKey = publicKey === match.player1.publicKey
      ? match.player2?.publicKey
      : match.player1.publicKey;

    if (!winnerKey) return;

    endMatch(match, winnerKey, 'forfeit');

    io.to(match.player1.socketId).emit('battle:game_over', {
      winner: winnerKey,
      reason: 'forfeit',
    });
    if (match.player2) {
      io.to(match.player2.socketId).emit('battle:game_over', {
        winner: winnerKey,
        reason: 'forfeit',
      });
    }

    console.log(c.yellow('[battle]') + ` ${shortKey}... forfeited match ${match.id}`);
  });

  // Disconnect handling is centralized in ws/socket.ts (grace period logic)
}

function emitTurnStart(io: Server, match: import('../matchmaking/entities.js').MatchRoom): void {
  const deadline = Date.now() + TURN_TIMEOUT_MS;

  io.to(match.player1.socketId).emit('battle:turn_start', {
    currentTurn: match.currentTurn,
    turnNumber: match.turnNumber,
    deadline,
  });
  io.to(match.player2!.socketId).emit('battle:turn_start', {
    currentTurn: match.currentTurn,
    turnNumber: match.turnNumber,
    deadline,
  });

  // Start turn timer
  startTurnTimer(match, (m) => {
    // Current player timed out — opponent wins
    const timedOutPlayer = m.currentTurn!;
    const winnerKey = timedOutPlayer === m.player1.publicKey
      ? m.player2!.publicKey
      : m.player1.publicKey;

    endMatch(m, winnerKey, 'timeout');

    io.to(m.player1.socketId).emit('battle:game_over', {
      winner: winnerKey,
      reason: 'timeout',
      turnNumber: m.turnNumber,
    });
    io.to(m.player2!.socketId).emit('battle:game_over', {
      winner: winnerKey,
      reason: 'timeout',
      turnNumber: m.turnNumber,
    });

    console.log(c.yellow('[battle]') + ` Match ${m.id} — TIMEOUT: ${timedOutPlayer.slice(0, 8)}...`);
  });
}
