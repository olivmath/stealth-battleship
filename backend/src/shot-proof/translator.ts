// Translator — shot proof HTTP boundary
// TODO: implement

import { Router } from 'express';
import type { ShotProofPort } from './interactor.js';
import { createShotProofAdapter } from './adapter.js';

export function createShotProofRouter(_port?: ShotProofPort): Router {
  const _adapter = _port ?? createShotProofAdapter();
  const router = Router();

  // TODO: router.post('/shot-proof', ...)

  return router;
}

export default createShotProofRouter();
