import { Router } from 'express';
import { getServerAddress, verifyPayment } from './interactor.js';
import { PVP_FEE_XLM } from './entities.js';

const router = Router();

router.get('/address', (_req, res) => {
  try {
    res.json({ address: getServerAddress(), feeXlm: PVP_FEE_XLM });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify', async (req, res) => {
  const { txHash, playerPk } = req.body;
  if (!txHash || !playerPk) {
    res.status(400).json({ error: 'txHash and playerPk required' });
    return;
  }
  const result = await verifyPayment(txHash, playerPk);
  res.json(result);
});

export { router as paymentRouter };
