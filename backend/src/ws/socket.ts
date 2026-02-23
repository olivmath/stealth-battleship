import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAuth } from '../auth/verifier.js';
import { AuthPayload } from '../auth/entities.js';
import { registerMatchmakingHandlers } from '../matchmaking/translator.js';
import { registerBattleHandlers } from '../battle/translator.js';
import { matches, matchCodeIndex, playerToMatch } from '../matchmaking/entities.js';
import { getPlayerMatch, removeMatch } from '../matchmaking/interactor.js';
import { endMatch } from '../battle/interactor.js';
import { c, debug } from '../log.js';

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

  debug('[ws]', 'Socket.io server created with cors=*, pingInterval=10s, pingTimeout=5s');

  // Rate limiter middleware for battle:attack
  function checkRateLimit(socketId: string): boolean {
    const now = Date.now();
    const last = lastAttackTime.get(socketId) || 0;
    if (now - last < ATTACK_COOLDOWN_MS) {
      debug('[ws]', `Rate limit hit for socket=${socketId.slice(0, 8)}, cooldown=${ATTACK_COOLDOWN_MS - (now - last)}ms remaining`);
      return false;
    }
    lastAttackTime.set(socketId, now);
    return true;
  }

  io.use((socket, next) => {
    const auth = socket.handshake.auth as AuthPayload;
    debug('[ws]', `Auth attempt from socket=${socket.id.slice(0, 8)}, publicKey=${auth.publicKey?.slice(0, 8) ?? 'none'}...`);
    const result = verifyAuth(auth);

    if (!result.valid) {
      debug('[ws]', `Auth REJECTED: ${result.error}`);
      console.log(c.red('[ws]') + ` Auth rejected: ${result.error}`);
      return next(new Error(result.error || 'Authentication failed'));
    }

    debug('[ws]', `Auth OK for ${result.publicKey?.slice(0, 8)}...`);
    (socket.data as { publicKey: string }).publicKey = result.publicKey!;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const publicKey = (socket.data as { publicKey: string }).publicKey;
    const shortKey = publicKey.slice(0, 8);

    debug('[ws]', `Connection from ${shortKey}..., socketId=${socket.id}, transport=${socket.conn.transport.name}`);

    // Cancel grace period if reconnecting
    const graceTimer = disconnectGrace.get(publicKey);
    if (graceTimer) {
      clearTimeout(graceTimer);
      disconnectGrace.delete(publicKey);
      console.log(c.green('[ws]') + ` ${shortKey}... reconnected within grace period`);
      debug('[ws]', `Grace period cancelled for ${shortKey}...`);

      // Update socketId in match room
      const match = getPlayerMatch(publicKey);
      if (match) {
        debug('[ws]', `Updating socketId in match ${match.id}, status=${match.status}`);
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

      debug('[ws]', `Disconnect: ${shortKey}..., reason=${reason}, remaining=${connectedPlayers.size}`);
      console.log(c.yellow('[ws]') + ` Player disconnected: ${c.dim(shortKey)}... (${reason})`);
      console.log(c.yellow('[ws]') + ` Online: ${c.val(String(connectedPlayers.size))}`);

      // Grace period: don't auto-forfeit immediately during battle
      const match = getPlayerMatch(publicKey);
      if (match && match.status === 'battle') {
        debug('[ws]', `Player ${shortKey}... in active battle ${match.id}, starting ${GRACE_PERIOD_MS}ms grace period`);
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

            debug('[ws]', `Grace expired for ${shortKey}..., auto-forfeit match ${m.id}`);
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
      const isStale = now - match.createdAt > MATCH_STALE_MS;
      if (isStale && (match.status === 'waiting' || match.status === 'placing' || match.status === 'finished')) {
        debug('[cleanup]', `Removing stale match ${matchId}, status=${match.status}, age=${Math.round((now - match.createdAt) / 1000)}s`);
        removeMatch(matchId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(c.gray('[cleanup]') + ` Removed ${cleaned} stale matches`);
    }
    debug('[cleanup]', `Cleanup tick: ${matches.size} active matches, ${connectedPlayers.size} players online`);
  }, MATCH_CLEANUP_INTERVAL_MS);

  return io;
}
