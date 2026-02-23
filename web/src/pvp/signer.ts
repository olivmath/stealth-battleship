// PvP action signer — Ed25519 signatures for backend auth

import nacl from 'tweetnacl';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Decode Stellar Base32 to raw bytes
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(encoded: string): Uint8Array {
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of encoded) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

function stellarSecretToRawSeed(stellarSecret: string): Uint8Array {
  const decoded = base32Decode(stellarSecret);
  // Skip version byte (1) and checksum (2) — raw seed is bytes 1..33
  return decoded.slice(1, 33);
}

function stellarPublicToRawKey(stellarPublic: string): Uint8Array {
  const decoded = base32Decode(stellarPublic);
  // Skip version byte (1) and checksum (2) — raw pubkey is bytes 1..33
  return decoded.slice(1, 33);
}

export interface SignerKeys {
  publicKeyHex: string;
  secretSeed: Uint8Array;   // 32-byte Ed25519 seed
  fullSecretKey: Uint8Array; // 64-byte nacl signing key
}

/**
 * Derive signer keys from Stellar secret. Call once per session.
 */
export function deriveSignerKeys(stellarSecret: string): SignerKeys {
  const seed = stellarSecretToRawSeed(stellarSecret);
  const kp = nacl.sign.keyPair.fromSeed(seed);
  return {
    publicKeyHex: bytesToHex(kp.publicKey),
    secretSeed: seed,
    fullSecretKey: kp.secretKey,
  };
}

/**
 * Get hex public key from Stellar public key string.
 */
export function stellarPublicToHex(stellarPublic: string): string {
  return bytesToHex(stellarPublicToRawKey(stellarPublic));
}

/**
 * Sign an auth challenge for Socket.io connection.
 */
export function signAuth(
  keys: SignerKeys,
  timestamp: number,
  nonce: string
): { publicKey: string; timestamp: number; nonce: string; signature: string } {
  const message = `${keys.publicKeyHex}:${timestamp}:${nonce}`;
  const msgBytes = new TextEncoder().encode(message);
  const sig = nacl.sign.detached(msgBytes, keys.fullSecretKey);

  return {
    publicKey: keys.publicKeyHex,
    timestamp,
    nonce,
    signature: bytesToHex(sig),
  };
}

/**
 * Sign a game action (attack, placement, shot_result).
 */
export function signAction(
  keys: SignerKeys,
  action: string,
  data: Record<string, unknown>
): { timestamp: number; signature: string } {
  const timestamp = Date.now();
  const dataStr = JSON.stringify(data);
  const message = `${keys.publicKeyHex}:${action}:${dataStr}:${timestamp}`;
  const msgBytes = new TextEncoder().encode(message);
  const sig = nacl.sign.detached(msgBytes, keys.fullSecretKey);

  return {
    timestamp,
    signature: bytesToHex(sig),
  };
}
