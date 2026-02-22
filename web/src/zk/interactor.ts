import type {
  ZKProvider,
  BoardValidityInput,
  BoardValidityResult,
  ShotProofInput,
  ShotProofResult,
  TurnsProofInput,
  TurnsProofResult,
  OnProgressCallback,
} from './entities';

let provider: ZKProvider | null = null;

export async function initZK(zkProvider: ZKProvider): Promise<void> {
  provider = zkProvider;
  await provider.init();
}

function getProvider(): ZKProvider {
  if (!provider) throw new Error('ZK not initialized. Call initZK() first.');
  return provider;
}

export async function boardValidity(
  input: BoardValidityInput,
  onProgress?: OnProgressCallback,
): Promise<BoardValidityResult> {
  return getProvider().boardValidity(input, onProgress);
}

export async function shotProof(
  input: ShotProofInput,
): Promise<ShotProofResult> {
  return getProvider().shotProof(input);
}

export async function turnsProof(
  input: TurnsProofInput,
): Promise<TurnsProofResult> {
  return getProvider().turnsProof(input);
}

export function destroyZK(): void {
  provider?.destroy();
  provider = null;
}
