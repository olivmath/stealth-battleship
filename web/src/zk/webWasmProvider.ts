import type {
  ZKProvider,
  BoardValidityInput,
  BoardValidityResult,
  ShotProofInput,
  ShotProofResult,
  TurnsProofInput,
  TurnsProofResult,
  ShipTuples,
  OnProgressCallback,
} from './entities';
import { MAX_ATTACKS } from './entities';

import boardValidityCircuit from './circuits/board_validity.json';
import hashHelperCircuit from './circuits/hash_helper.json';
import shotProofCircuit from './circuits/shot_proof.json';
import turnsProofCircuit from './circuits/turns_proof.json';

const TAG = '[ZK:WASM]';

const CIRCUITS: Record<string, any> = {
  hash_helper: hashHelperCircuit,
  board_validity: boardValidityCircuit,
  shot_proof: shotProofCircuit,
  turns_proof: turnsProofCircuit,
};

function toNoirShips(ships: ShipTuples) {
  return ships.map(([r, c, s, h]) => [String(r), String(c), String(s), h]);
}

function padAttacks(attacks: [number, number][]): [string, string][] {
  const padded: [string, string][] = attacks.map(([r, c]) => [String(r), String(c)]);
  while (padded.length < MAX_ATTACKS) {
    padded.push(['0', '0']);
  }
  return padded;
}

/**
 * Web WASM ZK Provider — uses NoirJS + @aztec/bb.js directly in the browser.
 * No WebView needed; circuit artifacts are loaded as JSON, WASM runs in-page.
 */
export class WebWasmZKProvider implements ZKProvider {
  private noirs: Record<string, any> = {};
  private Noir: any = null;
  private UltraHonkBackend: any = null;

  async init(): Promise<void> {
    console.log(`${TAG} Initializing WASM provider...`);
    const t0 = Date.now();

    const [noirMod, bbMod] = await Promise.all([
      import('@noir-lang/noir_js'),
      import('@aztec/bb.js'),
    ]);
    this.Noir = noirMod.Noir;
    this.UltraHonkBackend = bbMod.UltraHonkBackend;

    for (const [name, circuit] of Object.entries(CIRCUITS)) {
      this.noirs[name] = new this.Noir(circuit);
    }

    console.log(`${TAG} All circuits loaded (${Date.now() - t0}ms)`);
  }

  private async executeAndProve(circuitName: string, inputs: Record<string, any>): Promise<{ proof: Uint8Array; publicInputs: string[] }> {
    const noir = this.noirs[circuitName];
    if (!noir) throw new Error(`Circuit ${circuitName} not loaded`);

    const circuit = CIRCUITS[circuitName];
    const { witness } = await noir.execute(inputs);

    const backend = new this.UltraHonkBackend(circuit.bytecode);
    try {
      const proofData = await backend.generateProof(witness);
      return { proof: proofData.proof, publicInputs: proofData.publicInputs };
    } finally {
      await backend.destroy();
    }
  }

  private async execute(circuitName: string, inputs: Record<string, any>): Promise<any> {
    const noir = this.noirs[circuitName];
    if (!noir) throw new Error(`Circuit ${circuitName} not loaded`);
    const { returnValue } = await noir.execute(inputs);
    return returnValue;
  }

  async boardValidity(input: BoardValidityInput, onProgress?: OnProgressCallback): Promise<BoardValidityResult> {
    console.log(`${TAG} boardValidity() called`);
    const ships = toNoirShips(input.ships);
    const shipSizes = input.ships.map(([, , s]) => String(s));

    onProgress?.('1/2 — Computing board hash...');
    const t0 = Date.now();
    const boardHash = await this.execute('hash_helper', { ships, nonce: input.nonce });
    console.log(`${TAG} Board hash computed (${Date.now() - t0}ms): ${boardHash}`);

    onProgress?.('2/2 — Generating proof...');
    const t1 = Date.now();
    const result = await this.executeAndProve('board_validity', {
      ships,
      nonce: input.nonce,
      board_hash: boardHash,
      ship_sizes: shipSizes,
    });
    console.log(`${TAG} Proof generated (${Date.now() - t1}ms) — ${result.proof.length} bytes`);

    return { proof: result.proof, boardHash };
  }

  async shotProof(input: ShotProofInput, onProgress?: OnProgressCallback): Promise<ShotProofResult> {
    console.log(`${TAG} shotProof() called`);
    const ships = toNoirShips(input.ships);

    onProgress?.('Generating shot proof...');
    const t0 = Date.now();
    const result = await this.executeAndProve('shot_proof', {
      ships,
      nonce: input.nonce,
      board_hash: input.boardHash,
      row: String(input.row),
      col: String(input.col),
      is_hit: input.isHit,
    });
    console.log(`${TAG} Proof generated (${Date.now() - t0}ms) — ${result.proof.length} bytes`);

    return { proof: result.proof, isHit: input.isHit };
  }

  async turnsProof(input: TurnsProofInput, onProgress?: OnProgressCallback): Promise<TurnsProofResult> {
    console.log(`${TAG} turnsProof() called`);

    onProgress?.('Generating game result proof...');
    const t0 = Date.now();
    const result = await this.executeAndProve('turns_proof', {
      ships_player: toNoirShips(input.shipsPlayer),
      ships_ai: toNoirShips(input.shipsAi),
      nonce_player: input.noncePlayer,
      nonce_ai: input.nonceAi,
      board_hash_player: input.boardHashPlayer,
      board_hash_ai: input.boardHashAi,
      attacks_player: padAttacks(input.attacksPlayer),
      attacks_ai: padAttacks(input.attacksAi),
      n_attacks_player: String(input.attacksPlayer.length),
      n_attacks_ai: String(input.attacksAi.length),
      ship_sizes: input.shipSizes.map(String),
      winner: String(input.winner),
    });
    console.log(`${TAG} Proof generated (${Date.now() - t0}ms) — ${result.proof.length} bytes`);

    return { proof: result.proof, winner: input.winner };
  }

  destroy(): void {
    console.log(`${TAG} destroy()`);
    this.noirs = {};
  }
}
