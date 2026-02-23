import { Server, Socket } from 'socket.io';
import { getMatch, getPlayerMatch } from '../matchmaking/interactor.js';
import { verifyAction } from '../auth/verifier.js';
import {
  submitPlacement, processAttack, recordShotResult,
  advanceTurn, checkWinCondition, endMatch, startTurnTimer,
} from './interactor.js';
import {
  PlacementReadyPayload, AttackPayload, ShotResultPayload, ForfeitPayload, RevealPayload,
  TURN_TIMEOUT_MS, DEFENDER_RESPONSE_TIMEOUT_MS,
} from './entities.js';
import { c } from '../log.js';
import { persistMatch, persistAttack, persistMatchEnd, upsertPlayerStats, persistProofLog } from '../shared/persistence.js';
import { getCircuit } from '../shared/circuits.js';
import { getShipSizes } from '../matchmaking/entities.js';

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
  socket.on('placement:ready', async (data: PlacementReadyPayload) => {
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

    // Verify board_validity proof server-side
    const shipSizes = getShipSizes(match.gridSize);
    const boardPublicInputs = [data.boardHash, ...shipSizes.map(String)];
    try {
      const t0 = Date.now();
      const { backend } = getCircuit('board_validity');
      const proofBytes = new Uint8Array(data.proof);
      const isValid = await backend.verifyProof({ proof: proofBytes, publicInputs: boardPublicInputs });
      const verifyMs = Date.now() - t0;

      void persistProofLog({
        matchId: data.matchId, playerPk: publicKey, circuit: 'board_validity',
        proofSizeBytes: data.proof.length, verificationTimeMs: verifyMs, valid: isValid,
      });

      if (!isValid) {
        socket.emit('placement:error', { message: 'Invalid board proof' });
        console.log(c.red('[battle]') + ` ${shortKey}... INVALID board_validity proof`);
        return;
      }
      console.log(c.blue('[battle]') + ` ${shortKey}... board_validity ✓ ${c.time(`(${verifyMs}ms)`)}`);
    } catch (err: any) {
      socket.emit('placement:error', { message: 'Proof verification failed' });
      console.error(c.red('[battle]') + ` board_validity error: ${err.message}`);
      return;
    }

    const result = submitPlacement(match, publicKey, data.boardHash, data.proof);
    const opponentId = getOpponentSocketId(match, publicKey);

    if (opponentId) {
      io.to(opponentId).emit('placement:opponent_ready');
    }

    if (result.bothReady) {
      // Persist match to Supabase
      void persistMatch({
        id: match.id,
        gridSize: match.gridSize,
        player1Pk: match.player1.publicKey,
        player2Pk: match.player2!.publicKey,
      });

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
      // Persist defender timeout
      const loserKey = publicKey === match.player1.publicKey
        ? match.player2!.publicKey
        : match.player1.publicKey;
      void persistMatchEnd(match.id, publicKey, 'defender_timeout', match.turnNumber);
      void upsertPlayerStats(publicKey, true);
      void upsertPlayerStats(loserKey, false);
      console.log(c.yellow('[battle]') + ` Match ${match.id} — DEFENDER TIMEOUT`);
    }, DEFENDER_RESPONSE_TIMEOUT_MS);

    console.log(c.blue('[battle]') + ` ${shortKey}... attacks (${data.row},${data.col})`);
  });

  // ─── Shot Result (from defender) ───
  socket.on('battle:shot_result', async (data: ShotResultPayload) => {
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

    // Verify shot_proof server-side
    try {
      const t0 = Date.now();
      const { backend } = getCircuit('shot_proof');
      const proofBytes = new Uint8Array(data.proof);
      // publicInputs: boardHash of defender, row, col, result (1=hit, 0=miss)
      const defenderHash = publicKey === match.player1.publicKey
        ? match.player1BoardHash!
        : match.player2BoardHash!;
      const resultBit = data.result === 'hit' ? '1' : '0';
      const shotPublicInputs = [defenderHash, String(data.row), String(data.col), resultBit];
      const isValid = await backend.verifyProof({ proof: proofBytes, publicInputs: shotPublicInputs });
      const verifyMs = Date.now() - t0;

      void persistProofLog({
        matchId: data.matchId, playerPk: publicKey, circuit: 'shot_proof',
        proofSizeBytes: data.proof.length, verificationTimeMs: verifyMs, valid: isValid,
      });

      if (!isValid) {
        // Invalid shot proof = cheating → opponent wins instantly
        const attackerPk = publicKey === match.player1.publicKey
          ? match.player2!.publicKey : match.player1.publicKey;
        endMatch(match, attackerPk, 'invalid_proof');
        io.to(match.player1.socketId).emit('battle:game_over', {
          winner: attackerPk, reason: 'invalid_proof', turnNumber: match.turnNumber,
        });
        io.to(match.player2!.socketId).emit('battle:game_over', {
          winner: attackerPk, reason: 'invalid_proof', turnNumber: match.turnNumber,
        });
        void persistMatchEnd(match.id, attackerPk, 'invalid_proof', match.turnNumber);
        void upsertPlayerStats(attackerPk, true);
        void upsertPlayerStats(publicKey, false);
        console.log(c.red('[battle]') + ` ${shortKey}... INVALID shot_proof — INSTANT LOSS`);
        return;
      }
      console.log(c.blue('[battle]') + ` ${shortKey}... shot_proof ✓ ${c.time(`(${verifyMs}ms)`)}`);
    } catch (err: any) {
      socket.emit('battle:error', { message: 'Shot proof verification failed' });
      console.error(c.red('[battle]') + ` shot_proof error: ${err.message}`);
      return;
    }

    recordShotResult(match, publicKey, data.row, data.col, data.result);

    // Persist attack to Supabase (attacker is the opponent of the defender/responder)
    const attackerPk = publicKey === match.player1.publicKey
      ? match.player2!.publicKey
      : match.player1.publicKey;
    void persistAttack(match.id, attackerPk, data.row, data.col, data.result, match.turnNumber);

    // Notify attacker of confirmed result
    const attackerSocketId = getOpponentSocketId(match, publicKey);
    if (attackerSocketId) {
      io.to(attackerSocketId).emit('battle:result_confirmed', {
        row: data.row,
        col: data.col,
        result: data.result,
        turnNumber: match.turnNumber,
        sunkShipName: data.sunkShipName,
        sunkShipSize: data.sunkShipSize,
      });
    }

    console.log(c.blue('[battle]') + ` ${shortKey}... responds: ${data.result} at (${data.row},${data.col})`);

    // Check win condition
    if (checkWinCondition(match, publicKey)) {
      endMatch(match, attackerPk, 'all_ships_sunk');
      io.to(match.player1.socketId).emit('battle:game_over', {
        winner: attackerPk,
        reason: 'all_ships_sunk',
        turnNumber: match.turnNumber,
      });
      io.to(match.player2!.socketId).emit('battle:game_over', {
        winner: attackerPk,
        reason: 'all_ships_sunk',
        turnNumber: match.turnNumber,
      });
      // Persist match end and player stats
      void persistMatchEnd(match.id, attackerPk, 'all_ships_sunk', match.turnNumber);
      void upsertPlayerStats(attackerPk, true);
      void upsertPlayerStats(publicKey, false);
      console.log(c.boldGreen('[battle]') + ` Match ${match.id} — WINNER: ${attackerPk.slice(0, 8)}...`);
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

    // Persist forfeit
    void persistMatchEnd(match.id, winnerKey, 'forfeit', match.turnNumber);
    void upsertPlayerStats(winnerKey, true);
    void upsertPlayerStats(publicKey, false);

    console.log(c.yellow('[battle]') + ` ${shortKey}... forfeited match ${match.id}`);
  });

  // ─── Reveal (post-game: players reveal ships+nonce for turns_proof) ───
  socket.on('battle:reveal', async (data: RevealPayload) => {
    const match = getMatch(data.matchId);
    if (!match || match.status !== 'finished') {
      socket.emit('battle:error', { message: 'Match not finished or not found' });
      return;
    }

    const authResult = verifyAction({
      publicKey,
      action: 'battle:reveal',
      data: JSON.stringify({ matchId: data.matchId }),
      timestamp: data.timestamp,
      signature: data.signature,
    });
    if (!authResult.valid) {
      socket.emit('battle:error', { message: 'Invalid signature' });
      return;
    }

    // Store reveal data
    if (publicKey === match.player1.publicKey) {
      match.player1Reveal = { ships: data.ships, nonce: data.nonce };
    } else {
      match.player2Reveal = { ships: data.ships, nonce: data.nonce };
    }

    console.log(c.blue('[battle]') + ` ${shortKey}... revealed ships for ${match.id}`);

    // Both revealed? Generate turns_proof server-side
    if (match.player1Reveal && match.player2Reveal) {
      try {
        const t0 = Date.now();
        const { noir, backend } = getCircuit('turns_proof');

        const turnsInput = {
          player1_board: match.player1Reveal.ships,
          player1_nonce: match.player1Reveal.nonce,
          player1_board_hash: match.player1BoardHash!,
          player2_board: match.player2Reveal.ships,
          player2_nonce: match.player2Reveal.nonce,
          player2_board_hash: match.player2BoardHash!,
          attacks: match.attacks.map(a => ({
            row: a.row, col: a.col, result: a.result === 'hit' ? 1 : 0,
          })),
          total_turns: match.turnNumber,
        };

        const { witness } = await noir.execute(turnsInput);
        const proof = await backend.generateProof(witness);
        const verifyMs = Date.now() - t0;

        void persistProofLog({
          matchId: match.id, playerPk: 'server', circuit: 'turns_proof',
          proofSizeBytes: proof.proof.length, verificationTimeMs: verifyMs, valid: true,
        });

        // Notify both players
        const proofHex = Buffer.from(proof.proof).toString('hex');
        io.to(match.player1.socketId).emit('battle:turns_proof', {
          matchId: match.id, proof: proofHex,
        });
        io.to(match.player2!.socketId).emit('battle:turns_proof', {
          matchId: match.id, proof: proofHex,
        });

        console.log(c.boldGreen('[battle]') + ` turns_proof generated for ${match.id} ${c.time(`(${verifyMs}ms)`)}`);
      } catch (err: any) {
        console.error(c.red('[battle]') + ` turns_proof generation error: ${err.message}`);
        io.to(match.player1.socketId).emit('battle:error', { message: 'turns_proof generation failed' });
        io.to(match.player2!.socketId).emit('battle:error', { message: 'turns_proof generation failed' });
      }
    } else {
      socket.emit('battle:reveal_accepted');
    }
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

    // Persist timeout
    void persistMatchEnd(m.id, winnerKey, 'timeout', m.turnNumber);
    void upsertPlayerStats(winnerKey, true);
    void upsertPlayerStats(timedOutPlayer, false);

    console.log(c.yellow('[battle]') + ` Match ${m.id} — TIMEOUT: ${timedOutPlayer.slice(0, 8)}...`);
  });
}
