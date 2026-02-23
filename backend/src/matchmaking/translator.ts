import { Server, Socket } from 'socket.io';
import {
  findRandomMatch, cancelSearch, createFriendMatch, joinFriendMatch, removeMatch,
} from './interactor.js';
import { matchQueue } from './entities.js';
import { playerHasBattleToken, consumeBattleToken } from '../payment/interactor.js';
import { hexToStellarPublic } from '../auth/entities.js';
import { c, debug } from '../log.js';

export function registerMatchmakingHandlers(io: Server, socket: Socket): void {
  const publicKey = (socket.data as { publicKey: string }).publicKey;
  const stellarKey = hexToStellarPublic(publicKey);
  const shortKey = publicKey.slice(0, 8);

  socket.on('match:find_random', async (data: unknown) => {
    const payload = (typeof data === 'object' && data !== null ? data : {}) as { gridSize?: number };
    debug('[match]', `find_random from ${shortKey}..., gridSize=${payload?.gridSize}`);

    if (!(await playerHasBattleToken(stellarKey))) {
      debug('[match]', `${shortKey}... has no BATTLE token — rejected`);
      socket.emit('match:error', { message: 'Payment required to play PvP' });
      return;
    }

    const gridSize = payload?.gridSize || 10;
    console.log(c.magenta('[match]') + ` ${shortKey}... searching (${gridSize}x${gridSize})`);

    const result = findRandomMatch(publicKey, socket.id, gridSize);

    if (result.type === 'already_in_match') {
      socket.emit('match:error', { message: 'Already in a match' });
      return;
    }

    if (result.type === 'queued') {
      socket.emit('match:searching');
      debug('[match]', `${shortKey}... added to queue`);
      console.log(c.magenta('[match]') + ` ${shortKey}... queued`);
    } else {
      const match = result.match;
      const p1Id = match.player1.socketId;
      const p2Id = match.player2!.socketId;

      debug('[match]', `Pair found! matchId=${match.id}, p1=${match.player1.publicKey.slice(0, 8)}..., p2=${match.player2!.publicKey.slice(0, 8)}...`);

      // Re-verify opponent's token before consuming
      const opponentKey = match.player1.publicKey === publicKey
        ? match.player2!.publicKey
        : match.player1.publicKey;
      if (!(await playerHasBattleToken(hexToStellarPublic(opponentKey)))) {
        debug('[match]', `Opponent ${opponentKey.slice(0, 8)}... lost token — undoing match`);
        removeMatch(match.id);
        // Re-queue the searcher
        matchQueue.push({ publicKey, socketId: socket.id, gridSize, joinedAt: Date.now() });
        socket.emit('match:searching');
        io.to(opponentKey === match.player1.publicKey ? p1Id : p2Id).emit('match:error', {
          message: 'Payment required to play PvP',
        });
        return;
      }

      // Consume tokens with rollback on failure
      try {
        await consumeBattleToken(hexToStellarPublic(match.player1.publicKey));
      } catch (err) {
        debug('[match]', `Token consumption failed for p1: ${err}`);
        removeMatch(match.id);
        matchQueue.push({ publicKey: match.player2!.publicKey, socketId: p2Id, gridSize, joinedAt: Date.now() });
        io.to(p1Id).emit('match:error', { message: 'Token consumption failed' });
        io.to(p2Id).emit('match:searching');
        return;
      }
      try {
        await consumeBattleToken(hexToStellarPublic(match.player2!.publicKey));
      } catch (err) {
        debug('[match]', `Token consumption failed for p2: ${err}`);
        removeMatch(match.id);
        matchQueue.push({ publicKey: match.player1.publicKey, socketId: p1Id, gridSize, joinedAt: Date.now() });
        io.to(p1Id).emit('match:searching');
        io.to(p2Id).emit('match:error', { message: 'Token consumption failed' });
        return;
      }
      debug('[match]', `Tokens consumed for both players`);

      io.to(p1Id).emit('match:found', {
        matchId: match.id,
        opponent: match.player2!.publicKey,
        gridSize: match.gridSize,
      });
      io.to(p2Id).emit('match:found', {
        matchId: match.id,
        opponent: match.player1.publicKey,
        gridSize: match.gridSize,
      });

      console.log(c.magenta('[match]') + ` Paired! ${c.boldGreen(match.id)}`);
    }
  });

  socket.on('match:cancel_search', () => {
    debug('[match]', `cancel_search from ${shortKey}...`);
    cancelSearch(publicKey);
    socket.emit('match:search_cancelled');
    console.log(c.magenta('[match]') + ` ${shortKey}... cancelled search`);
  });

  socket.on('match:create_friend', async (data: unknown) => {
    const payload = (typeof data === 'object' && data !== null ? data : {}) as { gridSize?: number };
    debug('[match]', `create_friend from ${shortKey}..., gridSize=${payload?.gridSize}`);

    if (!(await playerHasBattleToken(stellarKey))) {
      debug('[match]', `${shortKey}... has no BATTLE token — rejected`);
      socket.emit('match:error', { message: 'Payment required to play PvP' });
      return;
    }

    const gridSize = payload?.gridSize || 10;
    const result = createFriendMatch(publicKey, socket.id, gridSize);

    if (!result.ok) {
      socket.emit('match:error', { message: result.error });
      return;
    }

    const { matchId, matchCode } = result;
    debug('[match]', `Friend match created: matchId=${matchId}, code=${matchCode}`);
    socket.emit('match:friend_created', { matchId, matchCode });
    console.log(c.magenta('[match]') + ` ${shortKey}... created friend match ${c.boldYellow(matchCode)}`);
  });

  socket.on('match:join_friend', async (data: unknown) => {
    const payload = (typeof data === 'object' && data !== null ? data : {}) as { matchCode?: string };
    debug('[match]', `join_friend from ${shortKey}..., code=${payload?.matchCode}`);

    if (!(await playerHasBattleToken(stellarKey))) {
      debug('[match]', `${shortKey}... has no BATTLE token — rejected`);
      socket.emit('match:error', { message: 'Payment required to play PvP' });
      return;
    }

    if (!payload?.matchCode) {
      socket.emit('match:error', { message: 'Match code required' });
      return;
    }

    const result = joinFriendMatch(payload.matchCode!, publicKey, socket.id);

    if (!result.ok) {
      debug('[match]', `join_friend failed: ${result.error}`);
      socket.emit('match:error', { message: result.error });
      console.log(c.magenta('[match]') + ` ${shortKey}... join failed: ${result.error}`);
      return;
    }

    const match = result.match;
    const p1Id = match.player1.socketId;

    // Consume tokens with rollback on failure
    try {
      await consumeBattleToken(hexToStellarPublic(match.player1.publicKey));
    } catch (err) {
      debug('[match]', `Token consumption failed for p1 in friend match: ${err}`);
      removeMatch(match.id);
      io.to(p1Id).emit('match:error', { message: 'Token consumption failed' });
      socket.emit('match:error', { message: 'Token consumption failed' });
      return;
    }
    try {
      await consumeBattleToken(stellarKey);
    } catch (err) {
      debug('[match]', `Token consumption failed for p2 in friend match: ${err}`);
      removeMatch(match.id);
      io.to(p1Id).emit('match:error', { message: 'Token consumption failed' });
      socket.emit('match:error', { message: 'Token consumption failed' });
      return;
    }
    debug('[match]', `Friend match joined: matchId=${match.id}, tokens consumed`);

    // Notify both players
    io.to(p1Id).emit('match:friend_joined', {
      matchId: match.id,
      opponent: publicKey,
      gridSize: match.gridSize,
    });
    socket.emit('match:friend_joined', {
      matchId: match.id,
      opponent: match.player1.publicKey,
      gridSize: match.gridSize,
    });

    console.log(c.magenta('[match]') + ` ${shortKey}... joined friend match ${c.boldGreen(match.id)}`);
  });
}
