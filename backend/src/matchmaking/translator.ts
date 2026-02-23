import { Server, Socket } from 'socket.io';
import {
  findRandomMatch, cancelSearch, createFriendMatch, joinFriendMatch,
} from './interactor.js';
import { playerHasBattleToken, consumeBattleToken } from '../payment/interactor.js';
import { c, debug } from '../log.js';

export function registerMatchmakingHandlers(io: Server, socket: Socket): void {
  const publicKey = (socket.data as { publicKey: string }).publicKey;
  const shortKey = publicKey.slice(0, 8);

  socket.on('match:find_random', async (data: { gridSize?: number }) => {
    debug('[match]', `find_random from ${shortKey}..., gridSize=${data?.gridSize}`);

    if (!(await playerHasBattleToken(publicKey))) {
      debug('[match]', `${shortKey}... has no BATTLE token — rejected`);
      socket.emit('match:error', { message: 'Payment required to play PvP' });
      return;
    }

    const gridSize = data?.gridSize || 10;
    console.log(c.magenta('[match]') + ` ${shortKey}... searching (${gridSize}x${gridSize})`);

    const result = findRandomMatch(publicKey, socket.id, gridSize);

    if (result.type === 'queued') {
      socket.emit('match:searching');
      debug('[match]', `${shortKey}... added to queue`);
      console.log(c.magenta('[match]') + ` ${shortKey}... queued`);
    } else {
      const match = result.match;
      const p1Id = match.player1.socketId;
      const p2Id = match.player2!.socketId;

      debug('[match]', `Pair found! matchId=${match.id}, p1=${match.player1.publicKey.slice(0, 8)}..., p2=${match.player2!.publicKey.slice(0, 8)}...`);

      // Clawback BATTLE tokens for both players on successful match
      await consumeBattleToken(match.player1.publicKey);
      await consumeBattleToken(match.player2!.publicKey);
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

  socket.on('match:create_friend', async (data: { gridSize?: number }) => {
    debug('[match]', `create_friend from ${shortKey}..., gridSize=${data?.gridSize}`);

    if (!(await playerHasBattleToken(publicKey))) {
      debug('[match]', `${shortKey}... has no BATTLE token — rejected`);
      socket.emit('match:error', { message: 'Payment required to play PvP' });
      return;
    }

    const gridSize = data?.gridSize || 10;
    const { matchId, matchCode } = createFriendMatch(publicKey, socket.id, gridSize);

    debug('[match]', `Friend match created: matchId=${matchId}, code=${matchCode}`);
    socket.emit('match:friend_created', { matchId, matchCode });
    console.log(c.magenta('[match]') + ` ${shortKey}... created friend match ${c.boldYellow(matchCode)}`);
  });

  socket.on('match:join_friend', async (data: { matchCode: string }) => {
    debug('[match]', `join_friend from ${shortKey}..., code=${data?.matchCode}`);

    if (!(await playerHasBattleToken(publicKey))) {
      debug('[match]', `${shortKey}... has no BATTLE token — rejected`);
      socket.emit('match:error', { message: 'Payment required to play PvP' });
      return;
    }

    if (!data?.matchCode) {
      socket.emit('match:error', { message: 'Match code required' });
      return;
    }

    const result = joinFriendMatch(data.matchCode, publicKey, socket.id);

    if (!result.ok) {
      debug('[match]', `join_friend failed: ${result.error}`);
      socket.emit('match:error', { message: result.error });
      console.log(c.magenta('[match]') + ` ${shortKey}... join failed: ${result.error}`);
      return;
    }

    const match = result.match;
    const p1Id = match.player1.socketId;

    // Clawback BATTLE tokens for both players on successful friend match
    await consumeBattleToken(match.player1.publicKey);
    await consumeBattleToken(publicKey);
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
