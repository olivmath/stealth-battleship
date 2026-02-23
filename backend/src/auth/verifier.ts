import nacl from 'tweetnacl';
import { AuthPayload, AuthResult, ActionPayload, AUTH_TIMEOUT_MS } from './entities.js';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function verifyAuth(payload: AuthPayload): AuthResult {
  const { publicKey, timestamp, nonce, signature } = payload;

  if (!publicKey || !signature || !nonce || !timestamp) {
    return { valid: false, error: 'Missing auth fields' };
  }

  // Check timestamp freshness
  const age = Date.now() - timestamp;
  if (age > AUTH_TIMEOUT_MS || age < -5000) {
    return { valid: false, error: 'Auth challenge expired or clock skew' };
  }

  try {
    const message = new TextEncoder().encode(`${publicKey}:${timestamp}:${nonce}`);
    const sigBytes = hexToBytes(signature);
    const pkBytes = hexToBytes(publicKey);

    const valid = nacl.sign.detached.verify(message, sigBytes, pkBytes);
    if (!valid) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true, publicKey };
  } catch {
    return { valid: false, error: 'Signature verification failed' };
  }
}

export function verifyAction(payload: ActionPayload): AuthResult {
  const { publicKey, action, data, timestamp, signature } = payload;

  if (!publicKey || !action || !signature || !timestamp) {
    return { valid: false, error: 'Missing action fields' };
  }

  const age = Date.now() - timestamp;
  if (age > AUTH_TIMEOUT_MS || age < -5000) {
    return { valid: false, error: 'Action signature expired' };
  }

  try {
    const message = new TextEncoder().encode(`${publicKey}:${action}:${data}:${timestamp}`);
    const sigBytes = hexToBytes(signature);
    const pkBytes = hexToBytes(publicKey);

    const valid = nacl.sign.detached.verify(message, sigBytes, pkBytes);
    if (!valid) {
      return { valid: false, error: 'Invalid action signature' };
    }

    return { valid: true, publicKey };
  } catch {
    return { valid: false, error: 'Action signature verification failed' };
  }
}
