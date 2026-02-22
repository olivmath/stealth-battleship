// Translator — turns proof HTTP boundary
// TODO: implement

import { Router } from 'express';
import type { TurnsProofPort } from './interactor.js';
import { createTurnsProofAdapter } from './adapter.js';

export function createTurnsProofRouter(_port?: TurnsProofPort): Router {
  const _adapter = _port ?? createTurnsProofAdapter();
  const router = Router();

  // TODO: router.post('/turns-proof', ...)

  return router;
}

export default createTurnsProofRouter();
