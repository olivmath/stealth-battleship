// wallet/translator.ts — hooks for wallet operations

import { useState, useCallback } from 'react';
import { hasWallet, getPublicKey } from './interactor';

export function useWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletExists, setWalletExists] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    const exists = await hasWallet();
    setWalletExists(exists);
    if (exists) {
      const pk = await getPublicKey();
      setPublicKey(pk);
    } else {
      setPublicKey(null);
    }
  }, []);

  return { publicKey, walletExists, refresh };
}
