// Translator — turns proof HTTP boundary

import { Router, type Request, type Response } from 'express';
import { validateTurnsProofInput } from '../shared/entities.js';
import { c } from '../log.js';
import { proveTurnsProof, type TurnsProofPort } from './interactor.js';
import { createTurnsProofAdapter } from './adapter.js';

let reqCounter = 0;

export function createTurnsProofRouter(port?: TurnsProofPort): Router {
  const router = Router();
  const adapter = port ?? createTurnsProofAdapter();

  router.post('/turns-proof', async (req: Request, res: Response) => {
    const id = ++reqCounter;
    const TAG = c.yellow(`[prove]`) + c.dim(`[#${id}]`);
    const t0 = Date.now();

    console.log('');
    console.log(`${TAG} ${c.bgYellow('TURNS PROOF REQUEST')}`);

    try {
      console.log(`${TAG} ${c.boldWhite('Step 1:')} Validating input...`);
      const validation = validateTurnsProofInput(req.body);

      if (!validation.ok) {
        console.log(`${TAG} ${c.err('✗')} ${validation.error}`);
        res.status(400).json({ error: validation.error });
        return;
      }

      console.log(`${TAG} ${c.ok('✓')} Input valid`);

      const result = await proveTurnsProof(validation.data, adapter, TAG);
      res.json(result);
    } catch (err: any) {
      const totalMs = Date.now() - t0;
      console.error('');
      console.error(`${TAG} ${c.bgRed(`ERROR — ${totalMs}ms`)}`);
      console.error(`${TAG}   ${c.label('Message')}: ${c.err(err.message)}`);
      console.error(`${TAG}   ${c.label('Stack')}:   ${c.dim(err.stack)}`);
      console.error('');
      res.status(500).json({
        error: 'Proof generation failed',
        details: err.message,
      });
    }
  });

  return router;
}

export default createTurnsProofRouter();
