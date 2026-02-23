// wallet/interactor.ts — use cases: generate, decrypt, balance

import { generateKeypair, isValidSecretKey } from './stellar';
import type { WalletData } from './entities';
import { encryptSecret, decryptSecret, saveWallet, getWallet } from './adapter';

export async function createWallet(pin: string): Promise<WalletData> {
  const { publicKey, secretKey } = generateKeypair();

  const { encrypted, salt, iv } = await encryptSecret(secretKey, pin);
  const wallet: WalletData = { publicKey, encryptedSecret: encrypted, salt, iv };
  await saveWallet(wallet);
  // Fund on testnet (fire-and-forget)
  fundWithFriendbot(publicKey).catch(() => {});
  return wallet;
}

export async function getSecretKey(pin: string): Promise<string> {
  const wallet = await getWallet();
  if (!wallet) throw new Error('No wallet found');
  try {
    const secret = await decryptSecret(wallet.encryptedSecret, wallet.salt, pin, wallet.iv);
    if (!isValidSecretKey(secret)) {
      throw new Error('Invalid PIN');
    }
    return secret;
  } catch {
    throw new Error('Invalid PIN');
  }
}

export async function hasWallet(): Promise<boolean> {
  const wallet = await getWallet();
  return wallet !== null;
}

export async function getPublicKey(): Promise<string | null> {
  const wallet = await getWallet();
  return wallet?.publicKey ?? null;
}

export { getWallet, clearWallet } from './adapter';

const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';

export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
  if (!res.ok) {
    const body = await res.text();
    if (!body.includes('createAccountAlreadyExist')) {
      throw new Error('Friendbot failed');
    }
  }
}

export async function sendPayment(secretKey: string, destination: string, amountXlm: string): Promise<string> {
  const { Keypair, TransactionBuilder, Networks, Operation, Asset, Horizon } = await import('@stellar/stellar-sdk');
  const server = new Horizon.Server('https://horizon-testnet.stellar.org');
  const kp = Keypair.fromSecret(secretKey);
  const account = await server.loadAccount(kp.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.payment({
      destination,
      asset: Asset.native(),
      amount: amountXlm,
    }))
    .setTimeout(30)
    .build();

  tx.sign(kp);
  const result = await server.submitTransaction(tx);
  return (result as any).hash;
}

export async function sendPaymentWithTrustline(
  secret: string,
  destination: string,
  amount: string,
  memo: string,
  assetCode: string,
): Promise<string> {
  const StellarSdk = await import('@stellar/stellar-sdk');
  const { Keypair, TransactionBuilder, Networks, Operation, Asset, Memo: StellarMemo } = StellarSdk;
  const horizon = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

  const kp = Keypair.fromSecret(secret);
  const account = await horizon.loadAccount(kp.publicKey());
  const battleAsset = new Asset(assetCode, destination);

  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset: battleAsset }))
    .addOperation(Operation.payment({
      destination,
      asset: Asset.native(),
      amount,
    }))
    .addMemo(StellarMemo.text(memo))
    .setTimeout(30)
    .build();

  tx.sign(kp);
  const result = await horizon.submitTransaction(tx);
  return (result as any).hash;
}

export async function getBalance(publicKey: string): Promise<string> {
  try {
    const res = await fetch(`${HORIZON_TESTNET}/accounts/${publicKey}`);
    if (!res.ok) return '0';
    const data = await res.json();
    const native = data.balances?.find((b: any) => b.asset_type === 'native');
    return native?.balance ?? '0';
  } catch {
    return '0';
  }
}
