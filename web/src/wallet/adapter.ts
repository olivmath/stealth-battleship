import { storage } from '../shared/storage';
import type { WalletData } from './entities';

const WALLET_KEY = '@battleship_wallet';

function safeParse<T>(data: string, fallback: T): T {
  try { return JSON.parse(data) as T; } catch { return fallback; }
}

export async function getWallet(): Promise<WalletData | null> {
  const data = await storage.getItem(WALLET_KEY);
  if (!data) return null;
  const parsed = safeParse<WalletData | null>(data, null);
  if (!parsed?.publicKey || !parsed?.encryptedSecret || !parsed?.salt) return null;
  return parsed;
}

export async function saveWallet(wallet: WalletData): Promise<void> {
  await storage.setItem(WALLET_KEY, JSON.stringify(wallet));
}

export async function clearWallet(): Promise<void> {
  await storage.removeItem(WALLET_KEY);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function deriveKey(pin: string, salt: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin + salt));
  return new Uint8Array(buf);
}

function xorEncrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
}

export async function encryptSecret(secretKey: string, pin: string): Promise<{ encrypted: string; salt: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = bytesToHex(saltBytes);
  const key = await deriveKey(pin, salt);
  const secretBytes = new TextEncoder().encode(secretKey);
  const encrypted = bytesToHex(xorEncrypt(secretBytes, key));
  return { encrypted, salt };
}

export async function decryptSecret(encrypted: string, salt: string, pin: string): Promise<string> {
  const key = await deriveKey(pin, salt);
  const encryptedBytes = hexToBytes(encrypted);
  const decrypted = xorEncrypt(encryptedBytes, key);
  return new TextDecoder().decode(decrypted);
}
