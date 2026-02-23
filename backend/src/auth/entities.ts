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
