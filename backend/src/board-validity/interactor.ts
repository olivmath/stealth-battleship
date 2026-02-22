// Interactor — use case orchestration (no Express, no Noir imports)

import type { BoardValidityInput, BoardValidityResult, ShipTuple } from '../shared/entities.js';
import { GRID_SIZE } from '../shared/entities.js';
import { c } from '../log.js';

/** Port interface — adapter must implement this */
export interface BoardValidityPort {
  computeBoardHash(ships: ShipTuple[], nonce: string): Promise<string>;
  generateProof(
    ships: ShipTuple[],
    nonce: string,
    boardHash: string,
  ): Promise<{ proof: Uint8Array; publicInputs: string[] }>;
}

function logBoardMatrix(tag: string, ships: ShipTuple[]) {
  const grid: number[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  for (const [row, col, size, horizontal] of ships) {
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row : row + i;
      const col2 = horizontal ? col + i : col;
      if (r < GRID_SIZE && col2 < GRID_SIZE) grid[r][col2] = 1;
    }
  }
  const colLabels = 'ABCDEFGHIJ'.slice(0, GRID_SIZE);
  console.log(`${tag} ${c.label('Board')} (${c.cyan('■')}=ship, ${c.gray('·')}=water):`);
  console.log(`${tag}     ${c.dim(colLabels.split('').join(' '))}`);
  grid.forEach((row, i) => {
    const cells = row.map(v => v ? c.cyan('■') : c.gray('·')).join(' ');
    const rowNum = String(i + 1).padStart(2);
    console.log(`${tag}  ${c.dim(rowNum)} ${cells}`);
  });
}

export async function proveBoardValidity(
  input: BoardValidityInput,
  port: BoardValidityPort,
  tag: string,
): Promise<BoardValidityResult> {
  const t0 = Date.now();
  const { ships, nonce } = input;

  console.log(`${tag} ${c.label('Ships')}: ${c.val(JSON.stringify(ships))}`);
  console.log(`${tag} ${c.label('Nonce')}: ${c.val(nonce)}`);
  logBoardMatrix(tag, ships);

  // --- Pass 1: Compute board hash ---
  console.log(`${tag} ${c.boldWhite('Pass 1/2:')} ${c.blue('Computing board hash (Poseidon2)...')}`);
  const t1 = Date.now();
  const boardHash = await port.computeBoardHash(ships, nonce);
  const hashMs = Date.now() - t1;
  console.log(`${tag} ${c.ok('✓')} Board hash: ${c.cyan(boardHash)} ${c.time(`(${hashMs}ms)`)}`);

  // --- Pass 2: Generate proof ---
  console.log(`${tag} ${c.boldWhite('Pass 2/2:')} ${c.magenta('Generating board_validity proof...')}`);
  const t2 = Date.now();
  const proofResult = await port.generateProof(ships, nonce, boardHash);
  const proofMs = Date.now() - t2;

  console.log(`${tag} ${c.ok('✓')} Proof generated ${c.time(`(${proofMs}ms)`)}`);
  console.log(`${tag}   ${c.label('Proof size')}: ${c.val(String(proofResult.proof.length))} bytes`);
  console.log(`${tag}   ${c.label('Public inputs')}: ${c.dim(JSON.stringify(proofResult.publicInputs))}`);

  const totalMs = Date.now() - t0;
  console.log('');
  console.log(`${tag} ${c.bgGreen(`COMPLETE — ${totalMs}ms`)}`);
  console.log(`${tag}   ${c.blue(`Hash: ${hashMs}ms`)} | ${c.green(`Proof: ${proofMs}ms`)}`);
  console.log('');

  return {
    proof: Array.from(proofResult.proof),
    boardHash: String(boardHash),
  };
}
