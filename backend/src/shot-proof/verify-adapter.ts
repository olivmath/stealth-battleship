// Adapter — implements ShotProofVerifyPort using Noir/bb.js

import { getCircuit } from '../shared/circuits.js';
import { c } from '../log.js';
import type { ShotProofVerifyPort } from './verify-interactor.js';

export function createShotProofVerifyAdapter(): ShotProofVerifyPort {
  return {
    async verifyProof(proof, publicInputs) {
      const circuit = getCircuit('shot_proof');

      console.log(`   ${c.blue('Verifying proof...')}`);
      const t0 = Date.now();
      const valid = await circuit.backend.verifyProof({
        proof: new Uint8Array(proof),
        publicInputs,
      }, { keccak: true });
      console.log(`   ${c.ok('✓')} Verification ${c.time(`(${Date.now() - t0}ms)`)}`);

      return valid;
    },
  };
}
