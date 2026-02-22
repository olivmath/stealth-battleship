import { storage } from '../shared/storage';
import type { WalletData } from './entities';

const WALLET_KEY = '@battleship_wallet';
const PBKDF2_ITERATIONS = 600_000;

function safeParse<T>(data: string, fallback: T): T {
  try { return JSON.parse(data) as T; } catch { return fallback; }
}

export async function getWallet(): Promise<WalletData | null> {
  const data = await storage.getItem(WALLET_KEY);
  if (!data) return null;
  const parsed = safeParse<WalletData | null>(data, null);
  if (!parsed?.publicKey || !parsed?.encryptedSecret || !parsed?.salt || !parsed?.iv) return null;
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

/**
 * Derive a 256-bit AES key from a PIN using PBKDF2 with SHA-256.
 * 600k iterations per OWASP 2023 recommendations for SHA-256.
 */
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt the Stellar secret key with AES-256-GCM.
 */
export async function encryptSecret(
  secretKey: string,
  pin: string,
): Promise<{ encrypted: string; salt: string; iv: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(secretKey),
  );
  return {
    encrypted: bytesToHex(new Uint8Array(ciphertext)),
    salt: bytesToHex(salt),
    iv: bytesToHex(iv),
  };
}

/**
 * Decrypt the Stellar secret key with AES-256-GCM.
 * Throws if PIN is wrong (GCM auth tag verification fails).
 */
export async function decryptSecret(
  encrypted: string,
  salt: string,
  pin: string,
  iv: string,
): Promise<string> {
  const key = await deriveKey(pin, hexToBytes(salt));
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToBytes(iv) },
    key,
    hexToBytes(encrypted),
  );
  return new TextDecoder().decode(plaintext);
}
