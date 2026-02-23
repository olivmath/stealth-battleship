// Adapter — implements TurnsProofPort using Noir/bb.js

import type { ShipTuple, AttackTuple } from '../shared/entities.js';
import { MAX_ATTACKS } from '../shared/entities.js';
import { getCircuit } from '../shared/circuits.js';
import { c } from '../log.js';
import type { TurnsProofPort } from './interactor.js';

function toNoirShips(ships: ShipTuple[]) {
  return ships.map(([r, c, s, h]) => [String(r), String(c), String(s), h]);
}

function padAttacks(attacks: AttackTuple[]): [string, string][] {
  const padded: [string, string][] = attacks.map(([r, c]) => [String(r), String(c)]);
  while (padded.length < MAX_ATTACKS) {
    padded.push(['0', '0']);
  }
  return padded;
}

export function createTurnsProofAdapter(): TurnsProofPort {
  return {
    async generateProof(
      shipsPlayer, shipsAi,
      noncePlayer, nonceAi,
      boardHashPlayer, boardHashAi,
      attacksPlayer, attacksAi,
      nAttacksPlayer, nAttacksAi,
      shipSizes, winner,
    ) {
      const circuit = getCircuit('turns_proof');

      const circuitInput = {
        ships_player: toNoirShips(shipsPlayer),
        ships_ai: toNoirShips(shipsAi),
        nonce_player: noncePlayer,
        nonce_ai: nonceAi,
        board_hash_player: boardHashPlayer,
        board_hash_ai: boardHashAi,
        attacks_player: padAttacks(attacksPlayer),
        attacks_ai: padAttacks(attacksAi),
        n_attacks_player: String(nAttacksPlayer),
        n_attacks_ai: String(nAttacksAi),
        ship_sizes: shipSizes.map(String),
        winner: String(winner),
      };
      console.log(`   ${c.label('Circuit inputs')}: ${c.dim(JSON.stringify(circuitInput))}`);

      console.log(`   ${c.blue('Executing witness...')}`);
      const t0 = Date.now();
      const { witness } = await circuit.noir.execute(circuitInput);
      console.log(`   ${c.ok('✓')} Witness ${c.time(`(${Date.now() - t0}ms)`)}`);

      console.log(`   ${c.magenta('Generating proof...')}`);
      const proofResult = await circuit.backend.generateProof(witness, { keccak: true });
      return proofResult;
    },
  };
}
