import nacl from 'tweetnacl';

nacl.setPRNG((x: Uint8Array, n: number) => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(n));
  for (let i = 0; i < n; i++) x[i] = randomBytes[i];
});

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(data: Uint8Array): string {
  let result = '';
  let bits = 0;
  let value = 0;
  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += ALPHABET[(value >> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    result += ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return result;
}

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

function crc16xmodem(data: Uint8Array): number {
  let crc = 0x0000;
  for (const byte of data) {
    let code = (crc >>> 8) & 0xff;
    code ^= byte & 0xff;
    code ^= code >>> 4;
    crc = ((crc << 8) & 0xffff) ^ code ^ ((code << 5) & 0xffff) ^ ((code << 12) & 0xffff);
  }
  return crc;
}

function encodeCheck(versionByte: number, data: Uint8Array): string {
  const payload = new Uint8Array(1 + data.length);
  payload[0] = versionByte;
  payload.set(data, 1);
  const checksum = crc16xmodem(payload);
  const full = new Uint8Array(payload.length + 2);
  full.set(payload);
  full[payload.length] = checksum & 0xff;
  full[payload.length + 1] = (checksum >> 8) & 0xff;
  return base32Encode(full);
}

function decodeCheck(encoded: string): { versionByte: number; data: Uint8Array } {
  const decoded = base32Decode(encoded);
  if (decoded.length < 3) throw new Error('Invalid encoded string');
  const payload = decoded.slice(0, -2);
  const checksumBytes = decoded.slice(-2);
  const checksum = checksumBytes[0] | (checksumBytes[1] << 8);
  if (crc16xmodem(payload) !== checksum) throw new Error('Invalid checksum');
  return { versionByte: payload[0], data: payload.slice(1) };
}

const VERSION_ACCOUNT = 6 << 3;
const VERSION_SEED = 18 << 3;

export interface StellarKeypair {
  publicKey: string;
  secretKey: string;
}

export function generateKeypair(): StellarKeypair {
  const kp = nacl.sign.keyPair();
  const publicKey = encodeCheck(VERSION_ACCOUNT, kp.publicKey);
  const secretKey = encodeCheck(VERSION_SEED, kp.secretKey.slice(0, 32));
  return { publicKey, secretKey };
}

export function keypairFromSecret(secret: string): StellarKeypair {
  const { versionByte, data } = decodeCheck(secret);
  if (versionByte !== VERSION_SEED) throw new Error('Invalid secret key: wrong version');
  const kp = nacl.sign.keyPair.fromSeed(data);
  const publicKey = encodeCheck(VERSION_ACCOUNT, kp.publicKey);
  return { publicKey, secretKey: secret };
}

export function isValidSecretKey(secret: string): boolean {
  try { keypairFromSecret(secret); return true; } catch { return false; }
}
