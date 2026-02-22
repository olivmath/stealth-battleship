// Interactor — shot proof use case
// TODO: implement

import type { ShotProofInput, ShotProofResult } from '../shared/entities.js';

export interface ShotProofPort {
  // TODO: define port methods
}

export async function proveShotProof(
  _input: ShotProofInput,
  _port: ShotProofPort,
  _tag: string,
): Promise<ShotProofResult> {
  throw new Error('Not implemented');
}
