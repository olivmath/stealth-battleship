// wallet/interactor.ts — use cases: generate, import, decrypt

import { generateKeypair, keypairFromSecret, isValidSecretKey } from './stellar';
import type { WalletData } from './entities';
import { encryptSecret, decryptSecret, saveWallet, getWallet } from './adapter';

export async function createWallet(pin: string): Promise<WalletData> {
  const { publicKey, secretKey } = generateKeypair();

  const { encrypted, salt } = await encryptSecret(secretKey, pin);
  const wallet: WalletData = { publicKey, encryptedSecret: encrypted, salt };
  await saveWallet(wallet);
  return wallet;
}

export async function importWallet(secretKeyInput: string, pin: string): Promise<WalletData> {
  const { publicKey } = keypairFromSecret(secretKeyInput.trim());

  const { encrypted, salt } = await encryptSecret(secretKeyInput.trim(), pin);
  const wallet: WalletData = { publicKey, encryptedSecret: encrypted, salt };
  await saveWallet(wallet);
  return wallet;
}

export async function getSecretKey(pin: string): Promise<string> {
  const wallet = await getWallet();
  if (!wallet) throw new Error('No wallet found');
  const secret = await decryptSecret(wallet.encryptedSecret, wallet.salt, pin);
  if (!isValidSecretKey(secret)) {
    throw new Error('Invalid PIN');
  }
  return secret;
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
