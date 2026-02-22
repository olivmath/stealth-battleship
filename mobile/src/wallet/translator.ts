// wallet/translator.ts — hooks for wallet operations

import { useState, useCallback } from 'react';
import { hasWallet, getPublicKey, getBalance } from './interactor';

export function useWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletExists, setWalletExists] = useState<boolean | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const exists = await hasWallet();
    setWalletExists(exists);
    if (exists) {
      const pk = await getPublicKey();
      setPublicKey(pk);
      if (pk) {
        getBalance(pk).then(setBalance).catch(() => setBalance(null));
      }
    } else {
      setPublicKey(null);
      setBalance(null);
    }
  }, []);

  return { publicKey, walletExists, balance, refresh };
}
