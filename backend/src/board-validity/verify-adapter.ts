// Adapter — implements BoardValidityVerifyPort using Noir/bb.js

import type { ShipTuple } from '../shared/entities.js';
import { getCircuit } from '../shared/circuits.js';
import { c } from '../log.js';
import type { BoardValidityVerifyPort } from './verify-interactor.js';

function toNoirShips(ships: ShipTuple[]) {
  return ships.map(([r, c, s, h]) => [String(r), String(c), String(s), h]);
}

export function createBoardValidityVerifyAdapter(): BoardValidityVerifyPort {
  return {
    async computeBoardHash(ships, nonce) {
      const noirShips = toNoirShips(ships);
      const hashCircuit = getCircuit('hash_helper');
      const hashResult = await hashCircuit.noir.execute({ ships: noirShips, nonce });
      return hashResult.returnValue as string;
    },

    async verifyProof(proof, publicInputs) {
      const circuit = getCircuit('board_validity');

      console.log(`   ${c.blue('Verifying proof...')}`);
      const t0 = Date.now();
      const valid = await circuit.backend.verifyProof({
        proof: new Uint8Array(proof),
        publicInputs,
      });
      console.log(`   ${c.ok('✓')} Verification ${c.time(`(${Date.now() - t0}ms)`)}`);

      return valid;
    },
  };
}
