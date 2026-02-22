// Translator — shot proof verify HTTP boundary

import { Router, type Request, type Response } from 'express';
import { validateShotProofVerifyInput } from '../shared/entities.js';
import { c } from '../log.js';
import { verifyShotProof, type ShotProofVerifyPort } from './verify-interactor.js';
import { createShotProofVerifyAdapter } from './verify-adapter.js';

let reqCounter = 0;

export function createShotProofVerifyRouter(port?: ShotProofVerifyPort): Router {
  const router = Router();
  const adapter = port ?? createShotProofVerifyAdapter();

  router.post('/shot-proof', async (req: Request, res: Response) => {
    const id = ++reqCounter;
    const TAG = c.cyan(`[verify]`) + c.dim(`[#${id}]`);
    const t0 = Date.now();

    console.log('');
    console.log(`${TAG} ${c.bgCyan('SHOT PROOF VERIFY REQUEST')}`);

    try {
      console.log(`${TAG} ${c.boldWhite('Step 1:')} Validating input...`);
      const validation = validateShotProofVerifyInput(req.body);

      if (!validation.ok) {
        console.log(`${TAG} ${c.err('✗')} ${validation.error}`);
        res.status(400).json({ error: validation.error });
        return;
      }

      console.log(`${TAG} ${c.ok('✓')} Input valid`);

      const result = await verifyShotProof(validation.data, adapter, TAG);
      res.json(result);
    } catch (err: any) {
      const totalMs = Date.now() - t0;
      console.error('');
      console.error(`${TAG} ${c.bgRed(`ERROR — ${totalMs}ms`)}`);
      console.error(`${TAG}   ${c.label('Message')}: ${c.err(err.message)}`);
      console.error(`${TAG}   ${c.label('Stack')}:   ${c.dim(err.stack)}`);
      console.error('');
      res.status(500).json({
        error: 'Proof verification failed',
        details: err.message,
      });
    }
  });

  return router;
}

export default createShotProofVerifyRouter();
