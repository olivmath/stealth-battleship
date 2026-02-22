// Interactor — turns proof use case (no Express, no Noir imports)

import type { TurnsProofInput, TurnsProofResult, ShipTuple, AttackTuple } from '../shared/entities.js';
import { c } from '../log.js';

export interface TurnsProofPort {
  generateProof(
    shipsPlayer: ShipTuple[],
    shipsAi: ShipTuple[],
    noncePlayer: string,
    nonceAi: string,
    boardHashPlayer: string,
    boardHashAi: string,
    attacksPlayer: AttackTuple[],
    attacksAi: AttackTuple[],
    nAttacksPlayer: number,
    nAttacksAi: number,
    shipSizes: number[],
    winner: number,
  ): Promise<{ proof: Uint8Array; publicInputs: string[] }>;
}

export async function proveTurnsProof(
  input: TurnsProofInput,
  port: TurnsProofPort,
  tag: string,
): Promise<TurnsProofResult> {
  const t0 = Date.now();

  console.log(`${tag} ${c.label('Player ships')}: ${c.val(JSON.stringify(input.shipsPlayer))}`);
  console.log(`${tag} ${c.label('AI ships')}:     ${c.val(JSON.stringify(input.shipsAi))}`);
  console.log(`${tag} ${c.label('Attacks')}:      player=${c.cyan(String(input.nAttacksPlayer))}, ai=${c.cyan(String(input.nAttacksAi))}`);
  console.log(`${tag} ${c.label('Winner')}:       ${input.winner === 0 ? c.ok('PLAYER') : c.err('AI')}`);

  console.log(`${tag} ${c.boldWhite('Generating turns_proof...')}`);
  const t1 = Date.now();
  const proofResult = await port.generateProof(
    input.shipsPlayer,
    input.shipsAi,
    input.noncePlayer,
    input.nonceAi,
    input.boardHashPlayer,
    input.boardHashAi,
    input.attacksPlayer,
    input.attacksAi,
    input.nAttacksPlayer,
    input.nAttacksAi,
    input.shipSizes,
    input.winner,
  );
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
