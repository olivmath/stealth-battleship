import { generateKeypair, keypairFromSecret, isValidSecretKey } from '../stellar';

describe('Stellar keypair', () => {
  it('generates a valid keypair', () => {
    const kp = generateKeypair();
    expect(kp.publicKey).toMatch(/^G[A-Z2-7]{55}$/);
    expect(kp.secretKey).toMatch(/^S[A-Z2-7]{55}$/);
  });

  it('generates unique keypairs', () => {
    const kp1 = generateKeypair();
    const kp2 = generateKeypair();
    expect(kp1.publicKey).not.toBe(kp2.publicKey);
    expect(kp1.secretKey).not.toBe(kp2.secretKey);
  });

  it('derives the same public key from a secret key', () => {
    const kp = generateKeypair();
    const restored = keypairFromSecret(kp.secretKey);
    expect(restored.publicKey).toBe(kp.publicKey);
    expect(restored.secretKey).toBe(kp.secretKey);
  });

  it('validates correct secret keys', () => {
    const kp = generateKeypair();
    expect(isValidSecretKey(kp.secretKey)).toBe(true);
  });

  it('rejects invalid secret keys', () => {
    expect(isValidSecretKey('INVALID')).toBe(false);
    expect(isValidSecretKey('')).toBe(false);
    expect(isValidSecretKey('GABC')).toBe(false); // public key format, not secret
  });

  it('rejects secret key with wrong checksum', () => {
    const kp = generateKeypair();
    // Corrupt last character
    const corrupted = kp.secretKey.slice(0, -1) + (kp.secretKey.endsWith('A') ? 'B' : 'A');
    expect(isValidSecretKey(corrupted)).toBe(false);
  });
});
