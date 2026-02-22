import { encryptSecret, decryptSecret } from '../adapter';

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async (_algo: string, data: string) => {
    // Simple deterministic "hash" for testing — just hex of char codes
    let hash = '';
    for (let i = 0; i < 32; i++) {
      const code = data.charCodeAt(i % data.length);
      hash += code.toString(16).padStart(2, '0');
    }
    return hash;
  }),
  getRandomBytes: jest.fn((size: number) => {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) bytes[i] = i + 1;
    return bytes;
  }),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

describe('wallet adapter encrypt/decrypt', () => {
  it('encrypts and decrypts a secret key with correct PIN', async () => {
    const secret = 'SCZANGBA5YHTNYVVV3C7CAZMCLM2ZUYQXKP7TOP5INGDSRTHSQ2HP7Y3';
    const pin = '1234';

    const { encrypted, salt } = await encryptSecret(secret, pin);
    expect(encrypted).not.toBe(secret);
    expect(salt).toBeTruthy();

    const decrypted = await decryptSecret(encrypted, salt, pin);
    expect(decrypted).toBe(secret);
  });

  it('produces different ciphertext with different PINs', async () => {
    const secret = 'SCZANGBA5YHTNYVVV3C7CAZMCLM2ZUYQXKP7TOP5INGDSRTHSQ2HP7Y3';

    const result1 = await encryptSecret(secret, '1234');
    const result2 = await encryptSecret(secret, '5678');

    // Same salt (mocked getRandomBytes is deterministic) but different key
    expect(result1.encrypted).not.toBe(result2.encrypted);
  });

  it('fails to decrypt with wrong PIN', async () => {
    const secret = 'SCZANGBA5YHTNYVVV3C7CAZMCLM2ZUYQXKP7TOP5INGDSRTHSQ2HP7Y3';
    const { encrypted, salt } = await encryptSecret(secret, '1234');

    const wrongDecrypt = await decryptSecret(encrypted, salt, '9999');
    expect(wrongDecrypt).not.toBe(secret);
  });
});
