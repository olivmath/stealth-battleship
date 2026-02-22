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
 * Web WASM ZK Provider — uses NoirJS + bb.js directly in the browser.
 * No WebView needed; circuit artifacts are loaded as JSON, WASM runs in-page.
 */
export class WebWasmZKProvider implements ZKProvider {
  private noir: Record<string, any> = {};
  private backend: any = null;
  private noirModule: any = null;
  private bbModule: any = null;

  async init(): Promise<void> {
    console.log(`${TAG} Initializing WASM provider...`);
    const t0 = Date.now();

    // Dynamic imports to avoid bundling on native
    const [noirMod, bbMod] = await Promise.all([
      import('@noir-lang/noir_js'),
      import('@noir-lang/backend_barretenberg'),
    ]);
    this.noirModule = noirMod;
    this.bbModule = bbMod;

    // Pre-load all circuits
    const circuits = {
      hash_helper: hashHelperCircuit,
      board_validity: boardValidityCircuit,
      shot_proof: shotProofCircuit,
      turns_proof: turnsProofCircuit,
    };

    for (const [name, circuit] of Object.entries(circuits)) {
      const noir = new noirMod.Noir(circuit as any);
      this.noir[name] = noir;
    }

    console.log(`${TAG} All circuits loaded (${Date.now() - t0}ms)`);
  }

  private async executeAndProve(circuitName: string, inputs: Record<string, any>): Promise<{ proof: Uint8Array; returnValue?: any }> {
    const noir = this.noir[circuitName];
    if (!noir) throw new Error(`Circuit ${circuitName} not loaded`);

    const { witness } = await noir.execute(inputs);
    const backend = new this.bbModule.BarretenbergBackend(
      circuitName === 'hash_helper' ? hashHelperCircuit :
      circuitName === 'board_validity' ? boardValidityCircuit :
      circuitName === 'shot_proof' ? shotProofCircuit :
      turnsProofCircuit as any
    );

    try {
      const proof = await backend.generateProof(witness);
      return { proof: proof.proof, returnValue: proof.publicInputs?.[0] };
    } finally {
      await backend.destroy();
    }
  }

  private async execute(circuitName: string, inputs: Record<string, any>): Promise<any> {
    const noir = this.noir[circuitName];
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
    this.noir = {};
  }
}
