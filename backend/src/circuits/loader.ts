import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { c } from '../log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TAG = c.magenta('[circuits]');

interface CircuitBundle {
  noir: Noir;
  backend: UltraHonkBackend;
  name: string;
}

const circuits = new Map<string, CircuitBundle>();

const CIRCUIT_DIR = path.resolve(
  __dirname,
  '../../../frontend/src/services/zk/circuits',
);

export async function loadCircuits(): Promise<void> {
  const names = ['hash_helper', 'board_validity'];

  console.log(`${TAG} Circuit dir: ${c.dim(CIRCUIT_DIR)}`);

  if (!fs.existsSync(CIRCUIT_DIR)) {
    throw new Error(
      `Circuit directory not found: ${CIRCUIT_DIR}. ` +
        'Make sure circuits are compiled (nargo compile) and copied to frontend/src/services/zk/circuits/',
    );
  }

  for (const name of names) {
    const filePath = path.join(CIRCUIT_DIR, `${name}.json`);
    console.log(`${TAG} Loading ${c.boldWhite(name)} from ${c.dim(filePath)}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Circuit file not found: ${filePath}`);
    }

    const t0 = Date.now();
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);

    console.log(`${TAG}   ${c.label('noir_version')}: ${c.val(json.noir_version)}`);
    console.log(`${TAG}   ${c.label('bytecode')}:     ${c.val(String(json.bytecode.length))} chars`);
    console.log(`${TAG}   ${c.label('params')}:       ${c.val(json.abi.parameters.map((p: any) => p.name).join(', '))}`);

    const noir = new Noir(json);
    const backend = new UltraHonkBackend(json.bytecode);

    circuits.set(name, { noir, backend, name });
    console.log(`${TAG} ${c.boldWhite(name)} ${c.ok('✓')} ${c.time(`(${Date.now() - t0}ms)`)}`);
  }

  console.log(`${TAG} All circuits ready ${c.ok(`(${circuits.size} loaded)`)}`);
}

export function getCircuit(name: string): CircuitBundle {
  const bundle = circuits.get(name);
  if (!bundle) {
    throw new Error(`Circuit not loaded: ${name}. Available: ${[...circuits.keys()].join(', ')}`);
  }
  return bundle;
}
