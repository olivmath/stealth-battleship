// wallet/interactor.ts — use cases: generate, import, decrypt

import { generateKeypair, keypairFromSecret, isValidSecretKey } from './stellar';
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

export async function importWallet(secretKeyInput: string, pin: string): Promise<WalletData> {
  const { publicKey } = keypairFromSecret(secretKeyInput.trim());

  const { encrypted, salt, iv } = await encryptSecret(secretKeyInput.trim(), pin);
  const wallet: WalletData = { publicKey, encryptedSecret: encrypted, salt, iv };
  await saveWallet(wallet);
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
