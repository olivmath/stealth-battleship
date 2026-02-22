import { Router, type Request, type Response } from 'express';
import { getCircuit } from '../circuits/loader.js';
import { c } from '../log.js';

type ShipTuple = [number, number, number, boolean];

interface BoardValidityRequest {
  ships: [ShipTuple, ShipTuple, ShipTuple];
  nonce: string;
}

let reqCounter = 0;

/** Convert ShipTuples to NoirJS format (strings + bool) */
function toNoirShips(ships: [ShipTuple, ShipTuple, ShipTuple]) {
  return ships.map(([r, c, s, h]) => [String(r), String(c), String(s), h]);
}

/** Print 6x6 board matrix from ship tuples */
function logBoardMatrix(tag: string, ships: [ShipTuple, ShipTuple, ShipTuple]) {
  const grid: number[][] = Array.from({ length: 6 }, () => Array(6).fill(0));
  for (const [row, col, size, horizontal] of ships) {
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row : row + i;
      const col2 = horizontal ? col + i : col;
      if (r < 6 && col2 < 6) grid[r][col2] = 1;
    }
  }
  console.log(`${tag} ${c.label('Board')} (${c.cyan('■')}=ship, ${c.gray('·')}=water):`);
  console.log(`${tag}     ${c.dim('A B C D E F')}`);
  grid.forEach((row, i) => {
    const cells = row.map(v => v ? c.cyan('■') : c.gray('·')).join(' ');
    console.log(`${tag}   ${c.dim(String(i + 1))} ${cells}`);
  });
}

const router = Router();

router.post('/board-validity', async (req: Request, res: Response) => {
  const id = ++reqCounter;
  const TAG = c.yellow(`[prove]`) + c.dim(`[#${id}]`);
  const t0 = Date.now();

  console.log('');
  console.log(`${TAG} ${c.bgYellow('BOARD VALIDITY PROOF REQUEST')}`);

  try {
    const { ships, nonce } = req.body as BoardValidityRequest;

    // --- Step 1: Validate input ---
    console.log(`${TAG} ${c.boldWhite('Step 1:')} Validating input...`);

    if (!ships || !Array.isArray(ships) || ships.length !== 3) {
      console.log(`${TAG} ${c.err('✗')} Invalid ships: expected array of 3 tuples`);
      res.status(400).json({ error: 'Invalid input: ships must be array of 3 tuples' });
      return;
    }
    if (!nonce || typeof nonce !== 'string') {
      console.log(`${TAG} ${c.err('✗')} Invalid nonce: expected non-empty string`);
      res.status(400).json({ error: 'Invalid input: nonce must be a non-empty string' });
      return;
    }

    for (let i = 0; i < 3; i++) {
      const s = ships[i];
      if (!Array.isArray(s) || s.length !== 4) {
        console.log(`${TAG} ${c.err('✗')} Ship ${i} invalid: expected [row, col, size, horizontal]`);
        res.status(400).json({ error: `Invalid ship[${i}]: expected [row, col, size, horizontal]` });
        return;
      }
    }

    console.log(`${TAG} ${c.ok('✓')} Input valid`);
    console.log(`${TAG}   ${c.label('Ships')}: ${c.val(JSON.stringify(ships))}`);
    console.log(`${TAG}   ${c.label('Nonce')}: ${c.val(nonce)}`);
    logBoardMatrix(TAG, ships);

    // --- Step 2: Format for Noir ---
    console.log(`${TAG} ${c.boldWhite('Step 2:')} Formatting inputs for Noir...`);
    const noirShips = toNoirShips(ships);
    const shipSizes = ships.map(([, , s]) => String(s));
    console.log(`${TAG}   ${c.label('noirShips')}: ${c.dim(JSON.stringify(noirShips))}`);
    console.log(`${TAG}   ${c.label('shipSizes')}: ${c.dim(JSON.stringify(shipSizes))}`);

    // --- Step 3: Pass 1 — Compute board hash ---
    console.log(`${TAG} ${c.boldWhite('Step 3:')} ${c.blue('[Pass 1/2]')} Computing board hash (Poseidon2)...`);
    const t1 = Date.now();

    const hashCircuit = getCircuit('hash_helper');
    const hashResult = await hashCircuit.noir.execute({
      ships: noirShips,
      nonce,
    });
    const boardHash = hashResult.returnValue as string;

    const hashMs = Date.now() - t1;
    console.log(`${TAG} ${c.ok('✓')} Board hash: ${c.cyan(boardHash)} ${c.time(`(${hashMs}ms)`)}`);

    // --- Step 4: Pass 2 — Generate proof ---
    console.log(`${TAG} ${c.boldWhite('Step 4:')} ${c.magenta('[Pass 2/2]')} Generating board_validity proof...`);
    const t2 = Date.now();

    const bvCircuit = getCircuit('board_validity');
    const circuitInput = {
      ships: noirShips,
      nonce,
      board_hash: boardHash,
      ship_sizes: shipSizes,
    };
    console.log(`${TAG}   ${c.label('Circuit inputs')}: ${c.dim(JSON.stringify(circuitInput))}`);

    console.log(`${TAG}   ${c.blue('Executing witness...')}`);
    const { witness } = await bvCircuit.noir.execute(circuitInput);
    const witnessMs = Date.now() - t2;
    console.log(`${TAG} ${c.ok('✓')} Witness generated ${c.time(`(${witnessMs}ms)`)}`);

    console.log(`${TAG}   ${c.magenta('Generating proof...')}`);
    const t3 = Date.now();
    const proofResult = await bvCircuit.backend.generateProof(witness);
    const proofMs = Date.now() - t3;

    console.log(`${TAG} ${c.ok('✓')} Proof generated ${c.time(`(${proofMs}ms)`)}`);
    console.log(`${TAG}   ${c.label('Proof size')}: ${c.val(String(proofResult.proof.length))} bytes`);
    console.log(`${TAG}   ${c.label('Public inputs')}: ${c.dim(JSON.stringify(proofResult.publicInputs))}`);

    // --- Step 5: Return result ---
    const totalMs = Date.now() - t0;
    console.log('');
    console.log(`${TAG} ${c.bgGreen(`COMPLETE — ${totalMs}ms`)}`);
    console.log(`${TAG}   ${c.blue(`Hash: ${hashMs}ms`)} | ${c.magenta(`Witness: ${witnessMs}ms`)} | ${c.green(`Proof: ${proofMs}ms`)}`);
    console.log('');

    res.json({
      proof: Array.from(proofResult.proof),
      boardHash: String(boardHash),
    });
  } catch (err: any) {
    const totalMs = Date.now() - t0;
    console.error('');
    console.error(`${TAG} ${c.bgRed(`ERROR — ${totalMs}ms`)}`);
    console.error(`${TAG}   ${c.label('Message')}: ${c.err(err.message)}`);
    console.error(`${TAG}   ${c.label('Stack')}:   ${c.dim(err.stack)}`);
    console.error('');
    res.status(500).json({
      error: 'Proof generation failed',
      details: err.message,
    });
  }
});

export default router;
