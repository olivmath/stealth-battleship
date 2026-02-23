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
import { c, debug } from '../log.js';
import { resetRateLimit } from '../ws/socket.js';
import { persistMatch, persistAttack, persistMatchEnd, upsertPlayerStats, persistProofLog } from '../shared/persistence.js';
import { getCircuit } from '../shared/circuits.js';
import { getShipSizes } from '../matchmaking/entities.js';
import { proveTurnsProof } from '../turns-proof/interactor.js';
import { createTurnsProofAdapter } from '../turns-proof/adapter.js';
import type { ShipTuple, AttackTuple } from '../shared/entities.js';
import { openMatchOnChain, closeMatchOnChain } from '../soroban/adapter.js';
import { getServerPublicKey } from '../payment/stellar-asset.js';

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
    debug('[battle]', `placement:ready from ${shortKey}..., matchId=${data.matchId}, boardHash=${data.boardHash?.slice(0, 16)}...`);

    const match = getMatch(data.matchId);
    if (!match || match.status !== 'placing') {
      debug('[battle]', `placement:ready REJECTED — match=${match?.id ?? 'null'}, status=${match?.status ?? 'n/a'}`);
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
      debug('[battle]', `placement:ready signature INVALID for ${shortKey}...`);
      socket.emit('placement:error', { message: 'Invalid signature' });
      return;
    }
    debug('[battle]', `placement:ready signature OK for ${shortKey}...`);

    // Verify board_validity proof server-side
    const shipSizes = getShipSizes(match.gridSize);
    const boardPublicInputs = [data.boardHash, ...shipSizes.map(String)];
    debug('[battle]', `Verifying board_validity proof, shipSizes=${shipSizes}, proofLen=${data.proof.length}`);
    try {
      const t0 = Date.now();
      const { backend } = getCircuit('board_validity');
      const proofBytes = new Uint8Array(data.proof);
      const isValid = await backend.verifyProof({ proof: proofBytes, publicInputs: boardPublicInputs }, { keccak: true });
      const verifyMs = Date.now() - t0;

      void persistProofLog({
        matchId: data.matchId, playerPk: publicKey, circuit: 'board_validity',
        proofSizeBytes: data.proof.length, verificationTimeMs: verifyMs, valid: isValid,
      });

      if (!isValid) {
        socket.emit('placement:error', { message: 'Invalid board proof' });
        console.log(c.red('[battle]') + ` ${shortKey}... INVALID board_validity proof`);
        debug('[battle]', `board_validity proof INVALID for ${shortKey}...`);
        return;
      }
      console.log(c.blue('[battle]') + ` ${shortKey}... board_validity ✓ ${c.time(`(${verifyMs}ms)`)}`);
      debug('[battle]', `board_validity proof VALID for ${shortKey}..., verifyMs=${verifyMs}`);
    } catch (err: any) {
      socket.emit('placement:error', { message: 'Proof verification failed' });
      console.error(c.red('[battle]') + ` board_validity error: ${err.message}`);
      debug('[battle]', `board_validity EXCEPTION: ${err.message}`);
      return;
    }

    const result = submitPlacement(match, publicKey, data.boardHash, data.proof);
    const opponentId = getOpponentSocketId(match, publicKey);
    debug('[battle]', `Placement submitted: bothReady=${result.bothReady}, firstTurn=${result.firstTurn}`);

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

      // Fire-and-forget: submit board proofs on-chain (3 txs: verify P1, verify P2, open_match)
      try {
        const serverAddr = getServerPublicKey();
        const shipSizes1 = getShipSizes(match.gridSize);
        const pubInputs1 = [match.player1BoardHash!, ...shipSizes1.map(String)];
        const pubInputs2 = [match.player2BoardHash!, ...shipSizes1.map(String)];
        console.log(c.cyan('[stellar]') + ` opening match ${c.boldCyan(match.id)} on-chain (3 txs)...`);
        void openMatchOnChain({
          p1Pk: serverAddr, p2Pk: serverAddr,
          proof1: match.player1BoardProof!, pubInputs1,
          proof2: match.player2BoardProof!, pubInputs2,
        }).then(({ sessionId }) => {
          match.sorobanSessionId = sessionId;
        }).catch((err) => {
          console.error(c.cyan('[stellar]') + ` open_match failed: ${c.err(err.message)}`);
        });
      } catch (err: any) {
        debug('[stellar]', `open_match skipped: ${err.message}`);
      }

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
      debug('[battle]', `BATTLE START matchId=${match.id}, firstTurn=${result.firstTurn}`);
    }
  });

  // ─── Attack ───
  socket.on('battle:attack', (data: AttackPayload) => {
    debug('[battle]', `attack from ${shortKey}..., matchId=${data.matchId}, pos=(${data.row},${data.col})`);

    // Rate limit check
    if (checkRateLimit && !checkRateLimit(socket.id)) {
      debug('[battle]', `attack RATE LIMITED for ${shortKey}...`);
      socket.emit('battle:error', { message: 'Rate limited — max 1 attack/second' });
      return;
    }

    const match = getMatch(data.matchId);
    if (!match) {
      debug('[battle]', `attack REJECTED — match not found: ${data.matchId}`);
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
      debug('[battle]', `attack signature INVALID for ${shortKey}...`);
      socket.emit('battle:error', { message: 'Invalid signature' });
      return;
    }

    const result = processAttack(match, publicKey, data.row, data.col);
    if (!result.ok) {
      debug('[battle]', `attack REJECTED: ${result.error}`);
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
      debug('[battle]', `Attack forwarded to defender, turn=${match.turnNumber}, defenderTimeout=${DEFENDER_RESPONSE_TIMEOUT_MS}ms`);
    }

    // Start defender response timeout
    if (match.defenderTimer) clearTimeout(match.defenderTimer);
    match.defenderTimer = setTimeout(() => {
      if (match.status !== 'battle') return;
      // Defender didn't respond — attacker wins
      debug('[battle]', `DEFENDER TIMEOUT in match ${match.id}`);
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
    debug('[battle]', `shot_result from ${shortKey}..., matchId=${data.matchId}, pos=(${data.row},${data.col}), result=${data.result}`);

    const match = getMatch(data.matchId);
    if (!match || match.status !== 'battle') {
      debug('[battle]', `shot_result REJECTED — match=${match?.id ?? 'null'}, status=${match?.status ?? 'n/a'}`);
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
      debug('[battle]', `shot_result signature INVALID for ${shortKey}...`);
      socket.emit('battle:error', { message: 'Invalid signature' });
      return;
    }

    // Clear defender response timer
    if (match.defenderTimer) {
      clearTimeout(match.defenderTimer);
      match.defenderTimer = undefined;
    }

    // Verify shot_proof server-side
    debug('[battle]', `Verifying shot_proof, proofLen=${data.proof.length}, sunk=${data.sunkShipName ?? 'none'}`);
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
      debug('[battle]', `shot_proof publicInputs: hash=${defenderHash.slice(0, 16)}..., row=${data.row}, col=${data.col}, result=${resultBit}`);
      const isValid = await backend.verifyProof({ proof: proofBytes, publicInputs: shotPublicInputs }, { keccak: true });
      const verifyMs = Date.now() - t0;

      void persistProofLog({
        matchId: data.matchId, playerPk: publicKey, circuit: 'shot_proof',
        proofSizeBytes: data.proof.length, verificationTimeMs: verifyMs, valid: isValid,
      });

      if (!isValid) {
        // Invalid shot proof = cheating → opponent wins instantly
        const attackerPk = publicKey === match.player1.publicKey
          ? match.player2!.publicKey : match.player1.publicKey;
        debug('[battle]', `shot_proof INVALID — ${shortKey}... loses, cheating detected`);
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
      debug('[battle]', `shot_proof VALID, verifyMs=${verifyMs}`);
    } catch (err: any) {
      socket.emit('battle:error', { message: 'Shot proof verification failed' });
      console.error(c.red('[battle]') + ` shot_proof error: ${err.message}`);
      debug('[battle]', `shot_proof EXCEPTION: ${err.message}`);
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
      debug('[battle]', `WIN CONDITION MET — attacker=${attackerPk.slice(0, 8)}... wins match ${match.id}`);
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
    debug('[battle]', `Turn advanced: turn=${match.turnNumber}, currentTurn=${match.currentTurn?.slice(0, 8)}...`);
    emitTurnStart(io, match);
  });

  // ─── Forfeit ───
  socket.on('battle:forfeit', (data: ForfeitPayload) => {
    debug('[battle]', `forfeit from ${shortKey}..., matchId=${data.matchId}`);

    const match = getMatch(data.matchId);
    if (!match || match.status === 'finished') {
      debug('[battle]', `forfeit IGNORED — match=${match?.id ?? 'null'}, status=${match?.status ?? 'n/a'}`);
      return;
    }

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

    debug('[battle]', `Forfeit processed: winner=${winnerKey.slice(0, 8)}...`);
    console.log(c.yellow('[battle]') + ` ${shortKey}... forfeited match ${match.id}`);
  });

  // ─── Reveal (post-game: players reveal ships+nonce for turns_proof) ───
  socket.on('battle:reveal', async (data: RevealPayload) => {
    debug('[battle]', `reveal from ${shortKey}..., matchId=${data.matchId}, ships=${data.ships?.length}, nonce=${data.nonce?.slice(0, 8)}...`);

    const match = getMatch(data.matchId);
    if (!match || match.status !== 'finished') {
      debug('[battle]', `reveal REJECTED — match=${match?.id ?? 'null'}, status=${match?.status ?? 'n/a'}`);
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
      debug('[battle]', `reveal signature INVALID for ${shortKey}...`);
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
    debug('[battle]', `Reveal stored. p1Reveal=${!!match.player1Reveal}, p2Reveal=${!!match.player2Reveal}`);

    // Both revealed? Generate turns_proof server-side
    if (match.player1Reveal && match.player2Reveal) {
      debug('[battle]', `Both revealed — generating turns_proof for match ${match.id}`);
      try {
        const t0 = Date.now();

        // Split attacks by player
        const attacksP1: AttackTuple[] = [];
        const attacksP2: AttackTuple[] = [];
        for (const a of match.attacks) {
          if (a.attacker === match.player1.publicKey) {
            attacksP1.push([a.row, a.col]);
          } else {
            attacksP2.push([a.row, a.col]);
          }
        }

        // Determine winner: 0 = player1, 1 = player2
        const winnerValue = match.winner === match.player1.publicKey ? 0 : 1;

        debug('[battle]', `turns_proof input: totalTurns=${match.turnNumber}, attacks=${match.attacks.length}`);

        const turnsProofAdapter = createTurnsProofAdapter();
        const turnsResult = await proveTurnsProof({
          shipsPlayer: match.player1Reveal.ships as ShipTuple[],
          shipsAi: match.player2Reveal.ships as ShipTuple[],
          noncePlayer: match.player1Reveal.nonce,
          nonceAi: match.player2Reveal.nonce,
          boardHashPlayer: match.player1BoardHash!,
          boardHashAi: match.player2BoardHash!,
          attacksPlayer: attacksP1,
          attacksAi: attacksP2,
          nAttacksPlayer: attacksP1.length,
          nAttacksAi: attacksP2.length,
          shipSizes: match.shipSizes,
          winner: winnerValue,
        }, turnsProofAdapter, c.blue('[battle]'));

        const proof = { proof: new Uint8Array(turnsResult.proof) };
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

        // Fire-and-forget: submit turns_proof on-chain
        try {
          console.log(c.cyan('[stellar]') + ` closing match ${c.boldCyan(match.id)} on-chain sessionId=${match.sorobanSessionId ?? 0}...`);
          void closeMatchOnChain({
            sessionId: match.sorobanSessionId ?? 0,
            proof: Array.from(proof.proof),
            pubInputs: turnsResult.publicInputs,
            player1Won: match.winner === match.player1.publicKey,
          }).catch((err) => {
            console.error(c.cyan('[stellar]') + ` close_match failed: ${c.err(err.message)}`);
          });
        } catch (err: any) {
          debug('[stellar]', `close_match skipped: ${err.message}`);
        }

        debug('[battle]', `turns_proof generated: proofSize=${proof.proof.length}, elapsed=${verifyMs}ms`);
        console.log(c.boldGreen('[battle]') + ` turns_proof generated for ${match.id} ${c.time(`(${verifyMs}ms)`)}`);
      } catch (err: any) {
        debug('[battle]', `turns_proof EXCEPTION: ${err.message}`);
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

  // Reset rate limit for active player so cooldown doesn't span across turns
  const activeSocketId = match.currentTurn === match.player1.publicKey
    ? match.player1.socketId
    : match.player2!.socketId;
  resetRateLimit(activeSocketId);

  debug('[battle]', `emitTurnStart: turn=${match.turnNumber}, currentTurn=${match.currentTurn?.slice(0, 8)}..., deadline=${new Date(deadline).toISOString()}`);

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

    debug('[battle]', `TURN TIMEOUT: ${timedOutPlayer.slice(0, 8)}... timed out, winner=${winnerKey.slice(0, 8)}...`);
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
