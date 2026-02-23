import { storage } from '../shared/storage';
import type { WalletData } from './entities';

const WALLET_KEY = '@stealth_wallet';
const PBKDF2_ITERATIONS = 600_000;

// Check if Web Crypto API is available (requires HTTPS on iOS Safari)
const hasSubtleCrypto = typeof crypto !== 'undefined'
  && typeof crypto.subtle !== 'undefined'
  && typeof crypto.subtle.importKey === 'function';

console.log(`[wallet] crypto.subtle available: ${hasSubtleCrypto}`);

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

// ─── Web Crypto (HTTPS / secure context) ───

async function deriveKeySubtle(pin: string, salt: Uint8Array): Promise<CryptoKey> {
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
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptSubtle(
  secretKey: string,
  pin: string,
): Promise<{ encrypted: string; salt: string; iv: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeySubtle(pin, salt);
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

async function decryptSubtle(
  encrypted: string,
  salt: string,
  pin: string,
  iv: string,
): Promise<string> {
  const key = await deriveKeySubtle(pin, hexToBytes(salt));
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToBytes(iv) as BufferSource },
    key,
    hexToBytes(encrypted) as BufferSource,
  );
  return new TextDecoder().decode(plaintext);
}

// ─── Fallback (HTTP / insecure context — dev/testnet only) ───
// XOR-based with PIN-derived key. NOT production-grade.

function deriveKeyFallback(pin: string, salt: Uint8Array): Uint8Array {
  const pinBytes = new TextEncoder().encode(pin);
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    key[i] = pinBytes[i % pinBytes.length] ^ salt[i % salt.length] ^ (i * 37);
  }
  // Simple stretching
  for (let round = 0; round < 1000; round++) {
    for (let i = 0; i < 32; i++) {
      key[i] = (key[i] ^ key[(i + 1) % 32] ^ (round & 0xff)) & 0xff;
    }
  }
  return key;
}

function encryptFallback(
  secretKey: string,
  pin: string,
): { encrypted: string; salt: string; iv: string } {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = deriveKeyFallback(pin, salt);
  const data = new TextEncoder().encode(secretKey);
  const cipher = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    cipher[i] = data[i] ^ key[i % 32] ^ iv[i % 12];
  }
  return {
    encrypted: bytesToHex(cipher),
    salt: bytesToHex(salt),
    iv: bytesToHex(iv),
  };
}

function decryptFallback(
  encrypted: string,
  salt: string,
  pin: string,
  iv: string,
): string {
  const key = deriveKeyFallback(pin, hexToBytes(salt));
  const cipher = hexToBytes(encrypted);
  const ivBytes = hexToBytes(iv);
  const plain = new Uint8Array(cipher.length);
  for (let i = 0; i < cipher.length; i++) {
    plain[i] = cipher[i] ^ key[i % 32] ^ ivBytes[i % 12];
  }
  return new TextDecoder().decode(plain);
}

// ─── Public API (auto-selects implementation) ───

export async function encryptSecret(
  secretKey: string,
  pin: string,
): Promise<{ encrypted: string; salt: string; iv: string }> {
  if (hasSubtleCrypto) {
    console.log('[wallet] Encrypting with Web Crypto (AES-GCM)');
    return encryptSubtle(secretKey, pin);
  }
  console.warn('[wallet] crypto.subtle unavailable — using fallback encryption (dev only)');
  return encryptFallback(secretKey, pin);
}

export async function decryptSecret(
  encrypted: string,
  salt: string,
  pin: string,
  iv: string,
): Promise<string> {
  if (hasSubtleCrypto) {
    console.log('[wallet] Decrypting with Web Crypto (AES-GCM)');
    return decryptSubtle(encrypted, salt, pin, iv);
  }
  console.warn('[wallet] crypto.subtle unavailable — using fallback decryption (dev only)');
  return decryptFallback(encrypted, salt, pin, iv);
}
