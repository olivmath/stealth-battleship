import { Router } from 'express';
import { getServerPublicKey } from './stellar-asset.js';
import { generateMemo, playerHasBattleToken } from './interactor.js';
import { PVP_FEE_XLM, BATTLE_ASSET_CODE } from './entities.js';
import { debug } from '../log.js';

const router = Router();

router.get('/address', (_req, res) => {
  debug('[payment]', 'GET /address');
  try {
    const address = getServerPublicKey();
    debug('[payment]', `Returning address=${address.slice(0, 8)}..., fee=${PVP_FEE_XLM}, asset=${BATTLE_ASSET_CODE}`);
    res.json({ address, feeXlm: PVP_FEE_XLM, assetCode: BATTLE_ASSET_CODE });
  } catch (err: any) {
    debug('[payment]', `GET /address ERROR: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

router.post('/memo', async (req, res) => {
  const { playerPk } = req.body;
  debug('[payment]', `POST /memo playerPk=${playerPk?.slice(0, 8) ?? 'undefined'}...`);
  if (!playerPk) { res.status(400).json({ error: 'playerPk required' }); return; }
  try {
    const memo = await generateMemo(playerPk);
    debug('[payment]', `Memo generated: ${memo}`);
    res.json({ memo, expiresInSeconds: 600 });
  } catch (err: any) {
    debug('[payment]', `POST /memo ERROR: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:playerPk', async (req, res) => {
  debug('[payment]', `GET /status/${req.params.playerPk.slice(0, 8)}...`);
  try {
    const hasToken = await playerHasBattleToken(req.params.playerPk);
    debug('[payment]', `hasToken=${hasToken}`);
    res.json({ hasToken });
  } catch (err: any) {
    debug('[payment]', `GET /status ERROR: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export { router as paymentRouter };
