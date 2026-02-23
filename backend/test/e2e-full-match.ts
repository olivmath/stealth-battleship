/**
 * E2E Full PvP Match — Stealth Battleship
 *
 * Simulates a complete PvP match:
 *   2 players connect → board_validity proofs → battle with shot_proofs → reveal → turns_proof → (optional) Soroban check
 *
 * Prerequisites:
 *   - Backend running: SKIP_PAYMENT=true npm run dev
 *   - Compiled circuits in circuits/compiled/
 *
 * Usage:
 *   npm run test:e2e
 */

import { io as ioClient, Socket } from 'socket.io-client';
import nacl from 'tweetnacl';
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import fs from 'node:fs';
import path from 'node:path';

// ─── Config ───

const SERVER_URL = process.env.E2E_SERVER_URL || 'http://localhost:3001';
const CIRCUIT_DIR = process.env.CIRCUIT_DIR
  ? path.resolve(process.env.CIRCUIT_DIR)
  : path.resolve(path.join('..', 'circuits', 'compiled'));
const GRID_SIZE = 10;

// ─── Ship Layout (10×10, both players identical) ───

type ShipTuple = [number, number, number, boolean];

const SHIPS: ShipTuple[] = [
  [0, 0, 5, true],  // Carrier
  [2, 0, 4, true],  // Battleship
  [4, 0, 3, true],  // Cruiser
  [6, 0, 3, true],  // Submarine
  [8, 0, 2, true],  // Destroyer
];

const SHIP_SIZES = [5, 4, 3, 3, 2];

const SHIP_NAMES = ['Carrier', 'Battleship', 'Cruiser', 'Submarine', 'Destroyer'];

// Pre-compute occupied cells for quick lookup
function getOccupiedCells(ships: ShipTuple[]): Map<string, number> {
  const cells = new Map<string, number>(); // "r,c" → shipIndex
  for (let i = 0; i < ships.length; i++) {
    const [r, c, size, horizontal] = ships[i];
    for (let j = 0; j < size; j++) {
      const cr = horizontal ? r : r + j;
      const cc = horizontal ? c + j : c;
      cells.set(`${cr},${cc}`, i);
    }
  }
  return cells;
}

// Targeted attack order: hit all ship cells for guaranteed hits
function buildTargetedAttacks(ships: ShipTuple[]): Array<[number, number]> {
  const attacks: Array<[number, number]> = [];
  for (const [r, c, size, horizontal] of ships) {
    for (let j = 0; j < size; j++) {
      attacks.push([horizontal ? r : r + j, horizontal ? c + j : c]);
    }
  }
  return attacks;
}

// Miss-only attacks: cells that DON'T contain ships (for the losing player)
function buildMissAttacks(ships: ShipTuple[], gridSize: number): Array<[number, number]> {
  const occupied = getOccupiedCells(ships);
  const attacks: Array<[number, number]> = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!occupied.has(`${r},${c}`)) {
        attacks.push([r, c]);
      }
    }
  }
  return attacks;
}

// ─── Helpers ───

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function signAuth(keypair: nacl.SignKeyPair): { publicKey: string; timestamp: number; nonce: string; signature: string } {
  const publicKey = bytesToHex(keypair.publicKey);
  const timestamp = Date.now();
  const nonce = bytesToHex(nacl.randomBytes(16));
  const message = new TextEncoder().encode(`${publicKey}:${timestamp}:${nonce}`);
  const signature = bytesToHex(nacl.sign.detached(message, keypair.secretKey));
  return { publicKey, timestamp, nonce, signature };
}

function signAction(
  keypair: nacl.SignKeyPair,
  action: string,
  data: string,
): { timestamp: number; signature: string } {
  const publicKey = bytesToHex(keypair.publicKey);
  const timestamp = Date.now();
  const message = new TextEncoder().encode(`${publicKey}:${action}:${data}:${timestamp}`);
  const signature = bytesToHex(nacl.sign.detached(message, keypair.secretKey));
  return { timestamp, signature };
}

function waitFor<T>(socket: Socket, event: string, timeoutMs = 60_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event);
      reject(new Error(`Timeout waiting for ${event} (${timeoutMs}ms)`));
    }, timeoutMs);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function log(phase: string, msg: string): void {
  console.log(`  [${phase}] ${msg}`);
}

function ok(msg: string): void {
  console.log(`  ✓ ${msg}`);
}

function fail(msg: string): void {
  console.error(`  ✗ ${msg}`);
}

// ─── Circuit Loading ───

interface CircuitBundle {
  noir: Noir;
  backend: UltraHonkBackend;
}

async function loadCircuit(name: string): Promise<CircuitBundle> {
  const filePath = path.join(CIRCUIT_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Circuit not found: ${filePath}`);
  const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const noir = new Noir(json);
  const backend = new UltraHonkBackend(json.bytecode);
  return { noir, backend };
}

function toNoirShips(ships: ShipTuple[]) {
  return ships.map(([r, c, s, h]) => [String(r), String(c), String(s), h]);
}

// ─── Proof Generation ───

async function computeBoardHash(
  hashHelper: CircuitBundle,
  ships: ShipTuple[],
  nonce: string,
): Promise<string> {
  const result = await hashHelper.noir.execute({ ships: toNoirShips(ships), nonce });
  return result.returnValue as string;
}

async function generateBoardValidityProof(
  boardValidity: CircuitBundle,
  ships: ShipTuple[],
  nonce: string,
  boardHash: string,
): Promise<number[]> {
  const input = {
    ships: toNoirShips(ships),
    nonce,
    board_hash: boardHash,
    ship_sizes: SHIP_SIZES.map(String),
  };
  const { witness } = await boardValidity.noir.execute(input);
  const proof = await boardValidity.backend.generateProof(witness, { keccak: true });
  return Array.from(proof.proof);
}

async function generateShotProof(
  shotProofCircuit: CircuitBundle,
  ships: ShipTuple[],
  nonce: string,
  boardHash: string,
  row: number,
  col: number,
  isHit: boolean,
): Promise<number[]> {
  const input = {
    ships: toNoirShips(ships),
    nonce,
    board_hash: boardHash,
    row: String(row),
    col: String(col),
    is_hit: isHit,
  };
  const { witness } = await shotProofCircuit.noir.execute(input);
  const proof = await shotProofCircuit.backend.generateProof(witness, { keccak: true });
  return Array.from(proof.proof);
}

// ─── Main E2E Test ───

async function main() {
  const t0 = Date.now();
  console.log('\n═══════════════════════════════════════════');
  console.log('  Stealth Battleship — E2E Full PvP Match');
  console.log('═══════════════════════════════════════════\n');

  // ─── Phase 1: Setup ───
  console.log('Phase 1: Setup');

  const kp1 = nacl.sign.keyPair();
  const kp2 = nacl.sign.keyPair();
  const pk1 = bytesToHex(kp1.publicKey);
  const pk2 = bytesToHex(kp2.publicKey);
  log('setup', `Player1: ${pk1.slice(0, 16)}...`);
  log('setup', `Player2: ${pk2.slice(0, 16)}...`);

  // Load circuits
  log('setup', 'Loading circuits...');
  const [hashHelper, boardValidity, shotProofCircuit] = await Promise.all([
    loadCircuit('hash_helper'),
    loadCircuit('board_validity'),
    loadCircuit('shot_proof'),
  ]);
  ok('Circuits loaded (hash_helper, board_validity, shot_proof)');

  // Compute board hashes & generate nonces
  const nonce1 = String(Math.floor(Math.random() * 2 ** 32));
  const nonce2 = String(Math.floor(Math.random() * 2 ** 32));

  log('setup', 'Computing board hashes...');
  const [boardHash1, boardHash2] = await Promise.all([
    computeBoardHash(hashHelper, SHIPS, nonce1),
    computeBoardHash(hashHelper, SHIPS, nonce2),
  ]);
  ok(`Player1 boardHash: ${boardHash1.slice(0, 20)}...`);
  ok(`Player2 boardHash: ${boardHash2.slice(0, 20)}...`);

  // Generate board_validity proofs
  log('setup', 'Generating board_validity proofs (this may take a minute)...');
  const [proof1, proof2] = await Promise.all([
    generateBoardValidityProof(boardValidity, SHIPS, nonce1, boardHash1),
    generateBoardValidityProof(boardValidity, SHIPS, nonce2, boardHash2),
  ]);
  ok(`Board proofs generated (P1: ${proof1.length} bytes, P2: ${proof2.length} bytes)`);

  // Connect sockets
  log('setup', `Connecting to ${SERVER_URL}...`);
  const auth1 = signAuth(kp1);
  const auth2 = signAuth(kp2);

  const s1 = ioClient(SERVER_URL, { auth: auth1, transports: ['websocket'] });
  const s2 = ioClient(SERVER_URL, { auth: auth2, transports: ['websocket'] });

  // Wait for connection
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      s1.on('connect', resolve);
      s1.on('connect_error', (err) => reject(new Error(`P1 connect failed: ${err.message}`)));
    }),
    new Promise<void>((resolve, reject) => {
      s2.on('connect', resolve);
      s2.on('connect_error', (err) => reject(new Error(`P2 connect failed: ${err.message}`)));
    }),
  ]);
  ok('Both players connected');

  // Error listeners
  s1.on('match:error', (d: any) => log('P1', `match:error → ${d.message}`));
  s2.on('match:error', (d: any) => log('P2', `match:error → ${d.message}`));
  s1.on('battle:error', (d: any) => log('P1', `battle:error → ${d.message}`));
  s2.on('battle:error', (d: any) => log('P2', `battle:error → ${d.message}`));
  s1.on('placement:error', (d: any) => log('P1', `placement:error → ${d.message}`));
  s2.on('placement:error', (d: any) => log('P2', `placement:error → ${d.message}`));

  try {
    // ─── Phase 2: Matchmaking ───
    console.log('\nPhase 2: Matchmaking');

    const friendCreatedP = waitFor<{ matchId: string; matchCode: string }>(s1, 'match:friend_created');
    s1.emit('match:create_friend', { gridSize: GRID_SIZE });
    const { matchId, matchCode } = await friendCreatedP;
    ok(`Match created: ${matchId}, code: ${matchCode}`);

    const joinedP1 = waitFor<{ matchId: string; opponent: string; gridSize: number }>(s1, 'match:friend_joined');
    const joinedP2 = waitFor<{ matchId: string; opponent: string; gridSize: number }>(s2, 'match:friend_joined');
    s2.emit('match:join_friend', { matchCode });
    const [joined1, joined2] = await Promise.all([joinedP1, joinedP2]);
    ok(`Both joined match ${joined1.matchId} (${joined1.gridSize}×${joined1.gridSize})`);

    const activeMatchId = joined1.matchId;

    // ─── Phase 3+4: Setup battle listeners BEFORE placement (avoid race) ───

    const occupiedCells = getOccupiedCells(SHIPS);
    const p1Attacks = buildTargetedAttacks(SHIPS);   // P1: all hits → wins fast
    const p2Attacks = buildMissAttacks(SHIPS, GRID_SIZE); // P2: all misses → P1 wins

    const hitsOnP1 = new Map<number, number>();
    const hitsOnP2 = new Map<number, number>();

    let p1AttackIdx = 0;
    let p2AttackIdx = 0;
    let turnCount = 0;
    let gameOver = false;
    let winner = '';
    let gameOverReason = '';

    // Register ALL battle listeners BEFORE placement so we don't miss turn_start
    const gameOverP = new Promise<{ winner: string; reason: string }>((resolve) => {
      s1.once('battle:game_over', (data: any) => resolve(data));
      s2.once('battle:game_over', (data: any) => resolve(data));
    });

    const battleDone = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Battle timeout (10 min)')), 600_000);

      gameOverP.then((data) => {
        gameOver = true;
        winner = data.winner;
        gameOverReason = data.reason;
        clearTimeout(timeout);
        resolve();
      });

      s1.on('battle:turn_start', async (data: { currentTurn: string; turnNumber: number }) => {
        if (gameOver) return;
        turnCount = data.turnNumber;

        if (data.currentTurn === pk1) {
          if (p1AttackIdx >= p1Attacks.length) return;
          const [row, col] = p1Attacks[p1AttackIdx];
          p1AttackIdx++;

          const actionData = JSON.stringify({ matchId: activeMatchId, row, col });
          const sig = signAction(kp1, 'battle:attack', actionData);
          s1.emit('battle:attack', {
            matchId: activeMatchId,
            row, col,
            timestamp: sig.timestamp,
            signature: sig.signature,
          });
        }
      });

      s2.on('battle:turn_start', async (data: { currentTurn: string; turnNumber: number }) => {
        if (gameOver) return;

        if (data.currentTurn === pk2) {
          if (p2AttackIdx >= p2Attacks.length) return;
          const [row, col] = p2Attacks[p2AttackIdx];
          p2AttackIdx++;

          const actionData = JSON.stringify({ matchId: activeMatchId, row, col });
          const sig = signAction(kp2, 'battle:attack', actionData);
          s2.emit('battle:attack', {
            matchId: activeMatchId,
            row, col,
            timestamp: sig.timestamp,
            signature: sig.signature,
          });
        }
      });

      s1.on('battle:incoming_attack', async (data: { row: number; col: number; turnNumber: number }) => {
        if (gameOver) return;
        try {
          const { row, col } = data;
          const cellKey = `${row},${col}`;
          const shipIdx = occupiedCells.get(cellKey);
          const isHit = shipIdx !== undefined;
          const result: 'hit' | 'miss' = isHit ? 'hit' : 'miss';

          const proof = await generateShotProof(
            shotProofCircuit, SHIPS, nonce1, boardHash1, row, col, isHit,
          );

          let sunkShipName: string | undefined;
          let sunkShipSize: number | undefined;
          if (isHit && shipIdx !== undefined) {
            hitsOnP1.set(shipIdx, (hitsOnP1.get(shipIdx) || 0) + 1);
            if (hitsOnP1.get(shipIdx) === SHIP_SIZES[shipIdx]) {
              sunkShipName = SHIP_NAMES[shipIdx];
              sunkShipSize = SHIP_SIZES[shipIdx];
            }
          }

          const actionData = JSON.stringify({ matchId: activeMatchId, row, col, result });
          const sig = signAction(kp1, 'battle:shot_result', actionData);
          s1.emit('battle:shot_result', {
            matchId: activeMatchId,
            row, col, result, proof,
            sunkShipName, sunkShipSize,
            timestamp: sig.timestamp,
            signature: sig.signature,
          });
        } catch (err: any) {
          fail(`P1 shot_proof error: ${err.message}`);
        }
      });

      s2.on('battle:incoming_attack', async (data: { row: number; col: number; turnNumber: number }) => {
        if (gameOver) return;
        try {
          const { row, col } = data;
          const cellKey = `${row},${col}`;
          const shipIdx = occupiedCells.get(cellKey);
          const isHit = shipIdx !== undefined;
          const result: 'hit' | 'miss' = isHit ? 'hit' : 'miss';

          const proof = await generateShotProof(
            shotProofCircuit, SHIPS, nonce2, boardHash2, row, col, isHit,
          );

          let sunkShipName: string | undefined;
          let sunkShipSize: number | undefined;
          if (isHit && shipIdx !== undefined) {
            hitsOnP2.set(shipIdx, (hitsOnP2.get(shipIdx) || 0) + 1);
            if (hitsOnP2.get(shipIdx) === SHIP_SIZES[shipIdx]) {
              sunkShipName = SHIP_NAMES[shipIdx];
              sunkShipSize = SHIP_SIZES[shipIdx];
            }
          }

          const actionData = JSON.stringify({ matchId: activeMatchId, row, col, result });
          const sig = signAction(kp2, 'battle:shot_result', actionData);
          s2.emit('battle:shot_result', {
            matchId: activeMatchId,
            row, col, result, proof,
            sunkShipName, sunkShipSize,
            timestamp: sig.timestamp,
            signature: sig.signature,
          });
        } catch (err: any) {
          fail(`P2 shot_proof error: ${err.message}`);
        }
      });

      s1.on('battle:result_confirmed', (data: any) => {
        if (turnCount % 5 === 0 || data.sunkShipName) {
          log('battle', `Turn ${turnCount}: P1 → (${data.row},${data.col}) ${data.result}${data.sunkShipName ? ` [SUNK ${data.sunkShipName}]` : ''}`);
        }
      });
      s2.on('battle:result_confirmed', (data: any) => {
        if (turnCount % 5 === 0 || data.sunkShipName) {
          log('battle', `Turn ${turnCount}: P2 → (${data.row},${data.col}) ${data.result}${data.sunkShipName ? ` [SUNK ${data.sunkShipName}]` : ''}`);
        }
      });
    });

    // ─── Phase 3: Placement ───
    console.log('\nPhase 3: Placement');

    const bothReadyP1 = waitFor<{ firstTurn: string }>(s1, 'placement:both_ready', 120_000);
    const bothReadyP2 = waitFor<{ firstTurn: string }>(s2, 'placement:both_ready', 120_000);

    const placementData1 = JSON.stringify({ matchId: activeMatchId, boardHash: boardHash1 });
    const sig1 = signAction(kp1, 'placement:ready', placementData1);
    s1.emit('placement:ready', {
      matchId: activeMatchId,
      boardHash: boardHash1,
      proof: proof1,
      timestamp: sig1.timestamp,
      signature: sig1.signature,
    });
    log('P1', 'placement:ready sent');

    const placementData2 = JSON.stringify({ matchId: activeMatchId, boardHash: boardHash2 });
    const sig2 = signAction(kp2, 'placement:ready', placementData2);
    s2.emit('placement:ready', {
      matchId: activeMatchId,
      boardHash: boardHash2,
      proof: proof2,
      timestamp: sig2.timestamp,
      signature: sig2.signature,
    });
    log('P2', 'placement:ready sent');

    const [ready1] = await Promise.all([bothReadyP1, bothReadyP2]);
    ok(`Both ready! First turn: ${ready1.firstTurn.slice(0, 16)}...`);

    // ─── Phase 4: Battle ───
    console.log('\nPhase 4: Battle');

    await battleDone;
    const winnerLabel = winner === pk1 ? 'Player1' : 'Player2';
    ok(`Game over! Winner: ${winnerLabel}, reason: ${gameOverReason}, turns: ${turnCount}`);

    // ─── Phase 5: Reveal ───
    console.log('\nPhase 5: Reveal & Turns Proof');

    const turnsProofP = new Promise<{ matchId: string; proof: string }>((resolve) => {
      s1.once('battle:turns_proof', (data: any) => resolve(data));
    });

    // Both reveal
    const revealData1 = JSON.stringify({ matchId: activeMatchId });
    const revealSig1 = signAction(kp1, 'battle:reveal', revealData1);
    s1.emit('battle:reveal', {
      matchId: activeMatchId,
      ships: SHIPS.map(([r, c, s, h]) => [r, c, s, h ? 1 : 0]),
      nonce: nonce1,
      timestamp: revealSig1.timestamp,
      signature: revealSig1.signature,
    });
    log('P1', 'reveal sent');

    const revealData2 = JSON.stringify({ matchId: activeMatchId });
    const revealSig2 = signAction(kp2, 'battle:reveal', revealData2);
    s2.emit('battle:reveal', {
      matchId: activeMatchId,
      ships: SHIPS.map(([r, c, s, h]) => [r, c, s, h ? 1 : 0]),
      nonce: nonce2,
      timestamp: revealSig2.timestamp,
      signature: revealSig2.signature,
    });
    log('P2', 'reveal sent');

    // Wait for turns_proof (server generates this, may take a while)
    log('reveal', 'Waiting for server to generate turns_proof...');
    const turnsProof = await Promise.race([
      turnsProofP,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('turns_proof timeout (5 min)')), 300_000)
      ),
    ]);
    ok(`turns_proof received (${turnsProof.proof.length} hex chars)`);

    // ─── Phase 6: Summary ───
    console.log('\n═══════════════════════════════════════════');
    console.log('  E2E Test Summary');
    console.log('═══════════════════════════════════════════');
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  Match ID:        ${activeMatchId}`);
    console.log(`  Grid:            ${GRID_SIZE}×${GRID_SIZE}`);
    console.log(`  Winner:          ${winnerLabel} (${winner.slice(0, 16)}...)`);
    console.log(`  Reason:          ${gameOverReason}`);
    console.log(`  Turns:           ${turnCount}`);
    console.log(`  P1 attacks:      ${p1AttackIdx}`);
    console.log(`  P2 attacks:      ${p2AttackIdx}`);
    console.log(`  Turns proof:     ${turnsProof.proof.length} hex chars`);
    console.log(`  Duration:        ${elapsed}s`);
    console.log('  Status:          ALL PASSED ✓');
    console.log('═══════════════════════════════════════════\n');

  } catch (err: any) {
    fail(`E2E FAILED: ${err.message}`);
    console.error(err);
    process.exitCode = 1;
  } finally {
    s1.disconnect();
    s2.disconnect();
    // Give sockets time to close cleanly
    await new Promise((r) => setTimeout(r, 500));
    process.exit(process.exitCode || 0);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
