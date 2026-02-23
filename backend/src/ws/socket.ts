import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAuth } from '../auth/verifier.js';
import { AuthPayload } from '../auth/entities.js';
import { registerMatchmakingHandlers } from '../matchmaking/translator.js';
import { registerBattleHandlers } from '../battle/translator.js';
import { matches, matchCodeIndex, playerToMatch } from '../matchmaking/entities.js';
import { getPlayerMatch, removeMatch } from '../matchmaking/interactor.js';
import { endMatch } from '../battle/interactor.js';
import { c } from '../log.js';

// Map: publicKey → socketId
export const connectedPlayers = new Map<string, string>();
// Map: socketId → publicKey
export const socketToPlayer = new Map<string, string>();

// Rate limiting: socketId → last attack timestamp
const lastAttackTime = new Map<string, number>();
const ATTACK_COOLDOWN_MS = 1000;

// Reconnection grace: publicKey → timeout handle
const disconnectGrace = new Map<string, ReturnType<typeof setTimeout>>();
const GRACE_PERIOD_MS = 60_000;

// Match cleanup interval
const MATCH_CLEANUP_INTERVAL_MS = 60_000;
const MATCH_STALE_MS = 5 * 60_000; // 5 min

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingInterval: 10_000,
    pingTimeout: 5_000,
  });

  // Rate limiter middleware for battle:attack
  function checkRateLimit(socketId: string): boolean {
    const now = Date.now();
    const last = lastAttackTime.get(socketId) || 0;
    if (now - last < ATTACK_COOLDOWN_MS) return false;
    lastAttackTime.set(socketId, now);
    return true;
  }

  io.use((socket, next) => {
    const auth = socket.handshake.auth as AuthPayload;
    const result = verifyAuth(auth);

    if (!result.valid) {
      console.log(c.red('[ws]') + ` Auth rejected: ${result.error}`);
      return next(new Error(result.error || 'Authentication failed'));
    }

    (socket.data as { publicKey: string }).publicKey = result.publicKey!;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const publicKey = (socket.data as { publicKey: string }).publicKey;
    const shortKey = publicKey.slice(0, 8);

    // Cancel grace period if reconnecting
    const graceTimer = disconnectGrace.get(publicKey);
    if (graceTimer) {
      clearTimeout(graceTimer);
      disconnectGrace.delete(publicKey);
      console.log(c.green('[ws]') + ` ${shortKey}... reconnected within grace period`);

      // Update socketId in match room
      const match = getPlayerMatch(publicKey);
      if (match) {
        if (match.player1.publicKey === publicKey) {
          match.player1.socketId = socket.id;
        } else if (match.player2?.publicKey === publicKey) {
          match.player2.socketId = socket.id;
        }
        socket.emit('pvp:reconnected', { matchId: match.id, phase: match.status });
      }
    }

    connectedPlayers.set(publicKey, socket.id);
    socketToPlayer.set(socket.id, publicKey);

    console.log(c.green('[ws]') + ` Player connected: ${c.boldCyan(shortKey)}... (${c.dim(socket.id)})`);
    console.log(c.green('[ws]') + ` Online: ${c.val(String(connectedPlayers.size))}`);

    registerMatchmakingHandlers(io, socket);
    registerBattleHandlers(io, socket, checkRateLimit);

    socket.on('disconnect', (reason) => {
      connectedPlayers.delete(publicKey);
      socketToPlayer.delete(socket.id);
      lastAttackTime.delete(socket.id);

      console.log(c.yellow('[ws]') + ` Player disconnected: ${c.dim(shortKey)}... (${reason})`);
      console.log(c.yellow('[ws]') + ` Online: ${c.val(String(connectedPlayers.size))}`);

      // Grace period: don't auto-forfeit immediately during battle
      const match = getPlayerMatch(publicKey);
      if (match && match.status === 'battle') {
        const opponentSocketId = match.player1.publicKey === publicKey
          ? match.player2?.socketId
          : match.player1.socketId;

        if (opponentSocketId) {
          io.to(opponentSocketId).emit('pvp:opponent_disconnected');
        }

        disconnectGrace.set(publicKey, setTimeout(() => {
          disconnectGrace.delete(publicKey);
          // Auto-forfeit after grace period
          const m = getPlayerMatch(publicKey);
          if (m && m.status === 'battle') {
            const winnerKey = m.player1.publicKey === publicKey
              ? m.player2!.publicKey
              : m.player1.publicKey;

            endMatch(m, winnerKey, 'disconnect_timeout');

            const winnerId = m.player1.publicKey === winnerKey
              ? m.player1.socketId
              : m.player2!.socketId;

            io.to(winnerId).emit('battle:game_over', {
              winner: winnerKey,
              reason: 'opponent_disconnected',
            });

            console.log(c.yellow('[ws]') + ` ${shortKey}... grace period expired — auto-forfeit`);
          }
        }, GRACE_PERIOD_MS));
      }
    });
  });

  // Periodic cleanup of stale matches
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [matchId, match] of matches.entries()) {
      if (match.status === 'waiting' && now - match.createdAt > MATCH_STALE_MS) {
        removeMatch(matchId);
        cleaned++;
      }
      if (match.status === 'finished' && now - match.createdAt > MATCH_STALE_MS) {
        removeMatch(matchId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(c.gray('[cleanup]') + ` Removed ${cleaned} stale matches`);
    }
  }, MATCH_CLEANUP_INTERVAL_MS);

  return io;
}
