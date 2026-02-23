import { Horizon, Keypair } from '@stellar/stellar-sdk';
import { PVP_FEE_XLM, verifiedPayments } from './entities.js';
import { c } from '../log.js';

const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');

let serverPublicKey: string | null = null;

export function initServerWallet(): string {
  const secret = process.env.STELLAR_SERVER_SECRET;
  if (!secret) throw new Error('STELLAR_SERVER_SECRET not set');
  const kp = Keypair.fromSecret(secret);
  serverPublicKey = kp.publicKey();
  console.log(c.cyan('[payment]') + ` Server wallet: ${serverPublicKey}`);
  return serverPublicKey;
}

export function getServerAddress(): string {
  if (!serverPublicKey) throw new Error('Server wallet not initialized');
  return serverPublicKey;
}

export async function verifyPayment(txHash: string, playerPk: string): Promise<{ valid: boolean; error?: string }> {
  if (verifiedPayments.has(txHash)) {
    return { valid: false, error: 'Transaction already used' };
  }

  try {
    const ops = await horizon.operations().forTransaction(txHash).call();

    const paymentOp = ops.records.find((op: any) =>
      op.type === 'payment' &&
      op.asset_type === 'native' &&
      op.to === serverPublicKey &&
      parseFloat(op.amount) >= parseFloat(PVP_FEE_XLM)
    );

    if (!paymentOp) {
      return { valid: false, error: 'No valid payment found in transaction' };
    }

    verifiedPayments.set(txHash, { txHash, playerPk, timestamp: Date.now() });

    console.log(c.cyan('[payment]') + ` Payment verified for ${playerPk.slice(0, 8)}...`);
    console.log(c.cyan('[payment]') + ` TX: https://stellar.expert/explorer/testnet/tx/${txHash}`);
    console.log(c.cyan('[payment]') + ` Amount: >= ${PVP_FEE_XLM} XLM | Verified payments in memory: ${verifiedPayments.size}`);

    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: `Horizon error: ${err.message}` };
  }
}

export function hasValidPayment(playerPk: string): boolean {
  for (const [, payment] of verifiedPayments) {
    if (payment.playerPk === playerPk) return true;
  }
  return false;
}

export function consumePayment(playerPk: string): void {
  for (const [hash, payment] of verifiedPayments) {
    if (payment.playerPk === playerPk) {
      verifiedPayments.delete(hash);
      return;
    }
  }
}
