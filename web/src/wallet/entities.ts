// wallet/entities.ts — pure types (zero external deps)

export interface WalletData {
  publicKey: string;
  encryptedSecret: string; // hex-encoded AES-GCM ciphertext (includes auth tag)
  salt: string; // hex-encoded random salt for PBKDF2 key derivation
  iv: string; // hex-encoded 12-byte AES-GCM nonce
}
