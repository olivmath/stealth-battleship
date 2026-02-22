// Interactor — board validity verify use case (no Express, no Noir imports)

import type { BoardValidityVerifyInput, VerifyResult, ShipTuple } from '../shared/entities.js';
import { c } from '../log.js';

export interface BoardValidityVerifyPort {
  computeBoardHash(ships: ShipTuple[], nonce: string): Promise<string>;
  verifyProof(proof: number[], publicInputs: string[]): Promise<boolean>;
}

export async function verifyBoardValidity(
  input: BoardValidityVerifyInput,
  port: BoardValidityVerifyPort,
  tag: string,
): Promise<VerifyResult> {
  const t0 = Date.now();
  const { ships, nonce, proof } = input;

  console.log(`${tag} ${c.label('Ships')}: ${c.val(JSON.stringify(ships))}`);
  console.log(`${tag} ${c.label('Nonce')}: ${c.val(nonce)}`);
  console.log(`${tag} ${c.label('Proof size')}: ${c.val(String(proof.length))} bytes`);

  // Compute board hash to use as public input
  console.log(`${tag} ${c.boldWhite('Step 1/2:')} ${c.blue('Computing board hash (Poseidon2)...')}`);
  const t1 = Date.now();
  const boardHash = await port.computeBoardHash(ships, nonce);
  console.log(`${tag} ${c.ok('✓')} Board hash: ${c.cyan(boardHash)} ${c.time(`(${Date.now() - t1}ms)`)}`);

  // Verify proof with public inputs
  const shipSizes = ships.map(([, , s]) => String(s));
  const publicInputs = [boardHash, ...shipSizes];

  console.log(`${tag} ${c.boldWhite('Step 2/2:')} ${c.magenta('Verifying board_validity proof...')}`);
  console.log(`${tag}   ${c.label('Public inputs')}: ${c.dim(JSON.stringify(publicInputs))}`);

  const valid = await port.verifyProof(proof, publicInputs);

  const totalMs = Date.now() - t0;
  console.log('');
  console.log(`${tag} ${valid ? c.bgGreen(`VALID — ${totalMs}ms`) : c.bgRed(`INVALID — ${totalMs}ms`)}`);
  console.log('');

  return { valid };
}
