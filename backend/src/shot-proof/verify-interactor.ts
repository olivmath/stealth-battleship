// Interactor — shot proof verify use case (no Express, no Noir imports)

import { performance } from 'perf_hooks';
import type { ShotProofVerifyInput, VerifyResult } from '../shared/entities.js';
import { c } from '../log.js';

export interface ShotProofVerifyPort {
  verifyProof(proof: number[], publicInputs: string[]): Promise<boolean>;
}

export async function verifyShotProof(
  input: ShotProofVerifyInput,
  port: ShotProofVerifyPort,
  tag: string,
): Promise<VerifyResult> {
  const startMs = performance.now();
  const t0 = Date.now();
  const { boardHash, row, col, isHit, proof } = input;

  console.log(`${tag} ${c.label('Target')}: (${c.cyan(String(row))}, ${c.cyan(String(col))}) → ${isHit ? c.ok('HIT') : c.gray('MISS')}`);
  console.log(`${tag} ${c.label('Board hash')}: ${c.dim(boardHash)}`);
  console.log(`${tag} ${c.label('Proof size')}: ${c.val(String(proof.length))} bytes`);

  // Public inputs: board_hash, row, col, is_hit
  const publicInputs = [boardHash, String(row), String(col), isHit ? '1' : '0'];

  console.log(`${tag} ${c.boldWhite('Verifying shot_proof...')}`);
  console.log(`${tag}   ${c.label('Public inputs')}: ${c.dim(JSON.stringify(publicInputs))}`);

  const valid = await port.verifyProof(proof, publicInputs);

  const totalMs = Date.now() - t0;
  console.log('');
  console.log(`${tag} ${valid ? c.bgGreen(`VALID — ${totalMs}ms`) : c.bgRed(`INVALID — ${totalMs}ms`)}`);
  console.log('');

  const elapsedMs = (performance.now() - startMs).toFixed(1);
  const proofSizeBytes = proof.length;
  console.log(
    `[VERIFY] circuit=shot_proof size=${proofSizeBytes}B time=${elapsedMs}ms valid=${valid}`
  );

  return { valid };
}
