// Interactor — shot proof use case (no Express, no Noir imports)

import type { ShotProofInput, ShotProofResult, ShipTuple } from '../shared/entities.js';
import { c } from '../log.js';

export interface ShotProofPort {
  generateProof(
    ships: [ShipTuple, ShipTuple, ShipTuple],
    nonce: string,
    boardHash: string,
    row: number,
    col: number,
    isHit: boolean,
  ): Promise<{ proof: Uint8Array; publicInputs: string[] }>;
}

export async function proveShotProof(
  input: ShotProofInput,
  port: ShotProofPort,
  tag: string,
): Promise<ShotProofResult> {
  const t0 = Date.now();
  const { ships, nonce, boardHash, row, col, isHit } = input;

  console.log(`${tag} ${c.label('Ships')}: ${c.val(JSON.stringify(ships))}`);
  console.log(`${tag} ${c.label('Target')}: (${c.cyan(String(row))}, ${c.cyan(String(col))}) → ${isHit ? c.ok('HIT') : c.gray('MISS')}`);
  console.log(`${tag} ${c.label('Board hash')}: ${c.dim(boardHash)}`);

  console.log(`${tag} ${c.boldWhite('Generating shot_proof...')}`);
  const t1 = Date.now();
  const proofResult = await port.generateProof(ships, nonce, boardHash, row, col, isHit);
  const proofMs = Date.now() - t1;

  console.log(`${tag} ${c.ok('✓')} Proof generated ${c.time(`(${proofMs}ms)`)}`);
  console.log(`${tag}   ${c.label('Proof size')}: ${c.val(String(proofResult.proof.length))} bytes`);
  console.log(`${tag}   ${c.label('Public inputs')}: ${c.dim(JSON.stringify(proofResult.publicInputs))}`);

  const totalMs = Date.now() - t0;
  console.log('');
  console.log(`${tag} ${c.bgGreen(`COMPLETE — ${totalMs}ms`)}`);
  console.log('');

  return { proof: Array.from(proofResult.proof) };
}
