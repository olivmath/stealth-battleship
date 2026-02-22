// wallet/entities.ts — pure types (zero external deps)

export interface WalletData {
  publicKey: string;
  encryptedSecret: string; // hex-encoded encrypted secret key
  salt: string; // hex-encoded random salt for key derivation
}
