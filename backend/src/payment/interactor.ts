import { Horizon } from '@stellar/stellar-sdk';
import { getSupabase } from '../shared/supabase.js';
import { getServerPublicKey, issueBattleToken, hasBattleToken, clawbackBattleToken } from './stellar-asset.js';
import { PVP_FEE_XLM } from './entities.js';
import { c } from '../log.js';
import crypto from 'crypto';

const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');

export async function generateMemo(playerPk: string): Promise<string> {
  const memo = `BZK-${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const sb = getSupabase();
  await sb.from('pending_payments').insert({ memo, player_pk: playerPk, status: 'pending', expires_at: expiresAt });
  console.log(c.cyan('[payment]') + ` Memo generated: ${memo} for ${playerPk.slice(0, 8)}...`);
  return memo;
}

export function startPaymentStream(): void {
  const serverPk = getServerPublicKey();
  console.log(c.cyan('[payment]') + ' Starting Horizon SSE payment stream...');
  horizon.payments().forAccount(serverPk).cursor('now').stream({
    onmessage: async (payment: any) => {
      if (payment.type !== 'payment' || payment.asset_type !== 'native') return;
      if (parseFloat(payment.amount) < parseFloat(PVP_FEE_XLM)) return;
      try {
        const tx = await horizon.transactions().transaction(payment.transaction_hash).call();
        const memo = tx.memo;
        if (!memo || !memo.startsWith('BZK-')) return;
        console.log(c.cyan('[payment]') + ` Detected payment: ${payment.amount} XLM, memo: ${memo}, from: ${payment.from.slice(0, 8)}...`);
        const sb = getSupabase();
        const { data: pending } = await sb.from('pending_payments').select().eq('memo', memo).eq('status', 'pending').single();
        if (!pending) { console.log(c.yellow('[payment]') + ` No pending payment for memo: ${memo}`); return; }
        if (new Date(pending.expires_at) < new Date()) {
          await sb.from('pending_payments').update({ status: 'expired' }).eq('memo', memo);
          console.log(c.yellow('[payment]') + ` Memo expired: ${memo}`); return;
        }
        const tokenTxHash = await issueBattleToken(pending.player_pk);
        await sb.from('pending_payments').update({ status: 'matched' }).eq('memo', memo);
        await sb.from('payments').insert({
          player_pk: pending.player_pk, tx_hash: payment.transaction_hash,
          amount_xlm: parseFloat(payment.amount), memo, battle_token_tx_hash: tokenTxHash, status: 'completed',
        });
        console.log(c.cyan('[payment]') + ` BATTLE token issued to ${pending.player_pk.slice(0, 8)}...`);
      } catch (err: any) {
        console.error(c.red('[payment]') + ` SSE handler error: ${err.message}`);
      }
    },
    onerror: (err: any) => { console.error(c.red('[payment]') + ` SSE stream error: ${err?.message || err}`); },
  });
}

export async function playerHasBattleToken(playerPk: string): Promise<boolean> {
  return hasBattleToken(playerPk);
}

export async function consumeBattleToken(playerPk: string): Promise<string> {
  return clawbackBattleToken(playerPk);
}
