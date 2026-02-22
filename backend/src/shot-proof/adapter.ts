// Adapter — implements ShotProofPort using Noir/bb.js

import type { ShipTuple } from '../shared/entities.js';
import { getCircuit } from '../shared/circuits.js';
import { c } from '../log.js';
import type { ShotProofPort } from './interactor.js';

function toNoirShips(ships: [ShipTuple, ShipTuple, ShipTuple]) {
  return ships.map(([r, c, s, h]) => [String(r), String(c), String(s), h]);
}

export function createShotProofAdapter(): ShotProofPort {
  return {
    async generateProof(ships, nonce, boardHash, row, col, isHit) {
      const noirShips = toNoirShips(ships);
      const circuit = getCircuit('shot_proof');

      const circuitInput = {
        ships: noirShips,
        nonce,
        board_hash: boardHash,
        row: String(row),
        col: String(col),
        is_hit: isHit,
      };
      console.log(`   ${c.label('Circuit inputs')}: ${c.dim(JSON.stringify(circuitInput))}`);

      console.log(`   ${c.blue('Executing witness...')}`);
      const t0 = Date.now();
      const { witness } = await circuit.noir.execute(circuitInput);
      console.log(`   ${c.ok('✓')} Witness ${c.time(`(${Date.now() - t0}ms)`)}`);

      console.log(`   ${c.magenta('Generating proof...')}`);
      const proofResult = await circuit.backend.generateProof(witness);
      return proofResult;
    },
  };
}
