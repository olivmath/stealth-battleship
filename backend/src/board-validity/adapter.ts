// Adapter — implements BoardValidityPort using Noir/bb.js

import type { ShipTuple } from '../shared/entities.js';
import { getCircuit } from '../shared/circuits.js';
import { c } from '../log.js';
import type { BoardValidityPort } from './interactor.js';

/** Convert ShipTuples to NoirJS format (strings + bool) */
function toNoirShips(ships: ShipTuple[]) {
  return ships.map(([r, c, s, h]) => [String(r), String(c), String(s), h]);
}

export function createBoardValidityAdapter(): BoardValidityPort {
  return {
    async computeBoardHash(ships, nonce) {
      const noirShips = toNoirShips(ships);
      const hashCircuit = getCircuit('hash_helper');
      const hashResult = await hashCircuit.noir.execute({ ships: noirShips, nonce });
      return hashResult.returnValue as string;
    },

    async generateProof(ships, nonce, boardHash) {
      const noirShips = toNoirShips(ships);
      const shipSizes = ships.map(([, , s]) => String(s));
      const bvCircuit = getCircuit('board_validity');

      const circuitInput = {
        ships: noirShips,
        nonce,
        board_hash: boardHash,
        ship_sizes: shipSizes,
      };
      console.log(`   ${c.label('Circuit inputs')}: ${c.dim(JSON.stringify(circuitInput))}`);

      console.log(`   ${c.blue('Executing witness...')}`);
      const t0 = Date.now();
      const { witness } = await bvCircuit.noir.execute(circuitInput);
      console.log(`   ${c.ok('✓')} Witness ${c.time(`(${Date.now() - t0}ms)`)}`);

      console.log(`   ${c.magenta('Generating proof...')}`);
      const proofResult = await bvCircuit.backend.generateProof(witness);
      return proofResult;
    },
  };
}
