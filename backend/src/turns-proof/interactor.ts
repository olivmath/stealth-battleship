// Interactor — turns proof use case
// TODO: implement

import type { TurnsProofInput, TurnsProofResult } from '../shared/entities.js';

export interface TurnsProofPort {
  // TODO: define port methods
}

export async function proveTurnsProof(
  _input: TurnsProofInput,
  _port: TurnsProofPort,
  _tag: string,
): Promise<TurnsProofResult> {
  throw new Error('Not implemented');
}
