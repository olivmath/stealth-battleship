import { Router } from 'express';
import { getServerPublicKey } from './stellar-asset.js';
import { generateMemo, playerHasBattleToken } from './interactor.js';
import { PVP_FEE_XLM, BATTLE_ASSET_CODE } from './entities.js';

const router = Router();

router.get('/address', (_req, res) => {
  try {
    res.json({ address: getServerPublicKey(), feeXlm: PVP_FEE_XLM, assetCode: BATTLE_ASSET_CODE });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/memo', async (req, res) => {
  const { playerPk } = req.body;
  if (!playerPk) { res.status(400).json({ error: 'playerPk required' }); return; }
  try {
    const memo = await generateMemo(playerPk);
    res.json({ memo, expiresInSeconds: 600 });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/status/:playerPk', async (req, res) => {
  try {
    const hasToken = await playerHasBattleToken(req.params.playerPk);
    res.json({ hasToken });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export { router as paymentRouter };
