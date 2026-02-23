// Auth entity types — zero external deps

export interface AuthPayload {
  publicKey: string;   // hex-encoded Ed25519 public key
  timestamp: number;   // unix ms
  nonce: string;       // random string
  signature: string;   // hex-encoded Ed25519 signature
}

export interface AuthResult {
  valid: boolean;
  publicKey?: string;
  error?: string;
}

export interface ActionPayload {
  publicKey: string;
  action: string;
  data: string;        // JSON-stringified payload
  timestamp: number;
  signature: string;   // hex-encoded Ed25519 signature
}

export const AUTH_TIMEOUT_MS = 30_000; // 30 seconds max age for auth challenge

/**
 * Convert Ed25519 hex public key to Stellar G... address.
 */
export function hexToStellarPublic(hex: string): string {
  // Stellar uses StrKey encoding: version byte (0x30 for public) + 32 raw bytes + 2 checksum bytes
  // We use @stellar/stellar-sdk's Keypair to do this properly
  const raw = Buffer.from(hex, 'hex');
  // Dynamic import avoided — use inline base32 + CRC16
  const versionByte = 6 << 3; // G = accountId = 6, shifted for StrKey
  const payload = Buffer.alloc(35);
  payload[0] = versionByte;
  raw.copy(payload, 1);
  // CRC16-XMODEM checksum
  let crc = 0x0000;
  for (let i = 0; i < 33; i++) {
    let code = (crc >>> 8) & 0xff;
    code ^= payload[i] & 0xff;
    code ^= code >>> 4;
    crc = (crc << 8) & 0xffff;
    crc ^= code;
    crc ^= (code << 5) & 0xffff;
    crc ^= (code << 12) & 0xffff;
  }
  payload[33] = crc & 0xff;
  payload[34] = (crc >>> 8) & 0xff;
  // Base32 encode
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;
  for (const byte of payload) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += ALPHABET[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    result += ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return result;
}
