// Interactor — turns proof verify use case (no Express, no Noir imports)

import type { TurnsProofVerifyInput, VerifyResult } from '../shared/entities.js';
import { c } from '../log.js';

export interface TurnsProofVerifyPort {
  verifyProof(proof: number[], publicInputs: string[]): Promise<boolean>;
}

export async function verifyTurnsProof(
  input: TurnsProofVerifyInput,
  port: TurnsProofVerifyPort,
  tag: string,
): Promise<VerifyResult> {
  const t0 = Date.now();
  const { boardHashPlayer, boardHashAi, shipSizes, winner, proof } = input;

  console.log(`${tag} ${c.label('Board hashes')}: player=${c.dim(boardHashPlayer)}, ai=${c.dim(boardHashAi)}`);
  console.log(`${tag} ${c.label('Winner')}: ${winner === 0 ? c.ok('PLAYER') : c.err('AI')}`);
  console.log(`${tag} ${c.label('Proof size')}: ${c.val(String(proof.length))} bytes`);

  // Public inputs: board_hash_player, board_hash_ai, ship_sizes[], winner
  const publicInputs = [
    boardHashPlayer,
    boardHashAi,
    ...shipSizes.map(String),
    String(winner),
  ];

  console.log(`${tag} ${c.boldWhite('Verifying turns_proof...')}`);
  console.log(`${tag}   ${c.label('Public inputs')}: ${c.dim(JSON.stringify(publicInputs))}`);

  const valid = await port.verifyProof(proof, publicInputs);

  const totalMs = Date.now() - t0;
  console.log('');
  console.log(`${tag} ${valid ? c.bgGreen(`VALID — ${totalMs}ms`) : c.bgRed(`INVALID — ${totalMs}ms`)}`);
  console.log('');

  return { valid };
}
