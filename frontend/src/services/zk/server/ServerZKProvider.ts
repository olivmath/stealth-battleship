import type {
  ZKProvider,
  BoardValidityInput,
  BoardValidityResult,
  ShotProofInput,
  ShotProofResult,
  TurnsProofInput,
  TurnsProofResult,
  OnProgressCallback,
} from '../types';

// ANSI colors work in Metro bundler terminal output
const TAG = '\x1b[33m\x1b[1m[ZK:Server]\x1b[0m';  // bold yellow
const ok = (s: string) => `\x1b[32m\x1b[1m${s}\x1b[0m`;
const fail = (s: string) => `\x1b[31m\x1b[1m${s}\x1b[0m`;
const info = (s: string) => `\x1b[36m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[90m${s}\x1b[0m`;
const label = (s: string) => `\x1b[35m\x1b[1m${s}\x1b[0m`;
const time = (s: string) => `\x1b[33m${s}\x1b[0m`;

/** ZK provider that delegates proof generation to a backend server */
export class ServerZKProvider implements ZKProvider {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    console.log(`${TAG} Created — baseUrl: ${info(this.baseUrl)}`);
  }

  async init(): Promise<void> {
    console.log(`${TAG} Health check → ${info(this.baseUrl + '/health')}`);
    const t0 = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) {
        throw new Error(`Health check failed: HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log(`${TAG} Health: ${ok(JSON.stringify(data))} ${time(`(${Date.now() - t0}ms)`)}`);
      console.log(`${TAG} ${ok('Provider ready ✓')}`);
    } catch (e: any) {
      console.error(`${TAG} ${fail(`✗ Server unreachable: ${e.message}`)}`);
      throw new Error(`ZK server unreachable at ${this.baseUrl}: ${e.message}`);
    }
  }

  async boardValidity(
    input: BoardValidityInput,
    onProgress?: OnProgressCallback,
  ): Promise<BoardValidityResult> {
    console.log(`${TAG} ${info('━━━ boardValidity() ━━━')}`);
    console.log(`${TAG} ${label('Ships')}: ${JSON.stringify(input.ships)}`);
    console.log(`${TAG} ${label('Nonce')}: ${input.nonce}`);

    onProgress?.('Sending to proof server...');
    const t0 = Date.now();

    const url = `${this.baseUrl}/api/prove/board-validity`;
    console.log(`${TAG} ${info('POST')} ${dim(url)}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ships: input.ships,
        nonce: input.nonce,
      }),
    });

    const elapsed = Date.now() - t0;
    const statusFn = res.ok ? ok : fail;
    console.log(`${TAG} Response: ${statusFn(String(res.status))} ${time(`(${elapsed}ms)`)}`);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`${TAG} ${fail(`✗ Server error: ${JSON.stringify(errData)}`)}`);
      throw new Error(`Server proof failed: ${errData.error || errData.details || res.statusText}`);
    }

    const data = await res.json();
    const proofBytes = new Uint8Array(data.proof);

    console.log(`${TAG} ${ok('✓ Proof received')}`);
    console.log(`${TAG} ${label('Proof size')}: ${proofBytes.length} bytes`);
    console.log(`${TAG} ${label('Board hash')}: ${info(data.boardHash)}`);
    console.log(`${TAG} ${label('Total time')}: ${time(`${elapsed}ms`)}`);
    console.log(`${TAG} ${info('━━━━━━━━━━━━━━━━━━━━━━━')}`);

    onProgress?.('Proof generated!');

    return {
      proof: proofBytes,
      boardHash: data.boardHash,
    };
  }

  async shotProof(_input: ShotProofInput): Promise<ShotProofResult> {
    throw new Error('shotProof not implemented on server yet');
  }

  async turnsProof(_input: TurnsProofInput): Promise<TurnsProofResult> {
    throw new Error('turnsProof not implemented on server yet');
  }

  destroy(): void {
    console.log(`${TAG} ${dim('destroy() — no-op for server provider')}`);
  }
}
