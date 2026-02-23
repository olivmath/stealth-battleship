import { Server, Socket } from 'socket.io';
import {
  findRandomMatch, cancelSearch, createFriendMatch, joinFriendMatch,
} from './interactor.js';
import { hasValidPayment, consumePayment } from '../payment/interactor.js';
import { c } from '../log.js';

export function registerMatchmakingHandlers(io: Server, socket: Socket): void {
  const publicKey = (socket.data as { publicKey: string }).publicKey;
  const shortKey = publicKey.slice(0, 8);

  socket.on('match:find_random', (data: { gridSize?: number }) => {
    if (!hasValidPayment(publicKey)) {
      socket.emit('match:error', { message: 'Payment required to play PvP' });
      return;
    }

    const gridSize = data?.gridSize || 10;
    console.log(c.magenta('[match]') + ` ${shortKey}... searching (${gridSize}x${gridSize})`);

    const result = findRandomMatch(publicKey, socket.id, gridSize);

    if (result.type === 'queued') {
      socket.emit('match:searching');
      console.log(c.magenta('[match]') + ` ${shortKey}... queued`);
    } else {
      const match = result.match;
      const p1Id = match.player1.socketId;
      const p2Id = match.player2!.socketId;

      // Consume payments for both players on successful match
      consumePayment(match.player1.publicKey);
      consumePayment(match.player2!.publicKey);

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
    cancelSearch(publicKey);
    socket.emit('match:search_cancelled');
    console.log(c.magenta('[match]') + ` ${shortKey}... cancelled search`);
  });

  socket.on('match:create_friend', (data: { gridSize?: number }) => {
    if (!hasValidPayment(publicKey)) {
      socket.emit('match:error', { message: 'Payment required to play PvP' });
      return;
    }

    const gridSize = data?.gridSize || 10;
    const { matchId, matchCode } = createFriendMatch(publicKey, socket.id, gridSize);

    socket.emit('match:friend_created', { matchId, matchCode });
    console.log(c.magenta('[match]') + ` ${shortKey}... created friend match ${c.boldYellow(matchCode)}`);
  });

  socket.on('match:join_friend', (data: { matchCode: string }) => {
    if (!hasValidPayment(publicKey)) {
      socket.emit('match:error', { message: 'Payment required to play PvP' });
      return;
    }

    if (!data?.matchCode) {
      socket.emit('match:error', { message: 'Match code required' });
      return;
    }

    const result = joinFriendMatch(data.matchCode, publicKey, socket.id);

    if (!result.ok) {
      socket.emit('match:error', { message: result.error });
      console.log(c.magenta('[match]') + ` ${shortKey}... join failed: ${result.error}`);
      return;
    }

    const match = result.match;
    const p1Id = match.player1.socketId;

    // Consume payments for both players on successful friend match
    consumePayment(match.player1.publicKey);
    consumePayment(publicKey);

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
