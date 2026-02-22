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

// ─── Server ZK Provider ──────────────────────────────────────────────

const SERVER_TAG = '\x1b[33m\x1b[1m[ZK:Server]\x1b[0m';
const ok = (s: string) => `\x1b[32m\x1b[1m${s}\x1b[0m`;
const fail = (s: string) => `\x1b[31m\x1b[1m${s}\x1b[0m`;
const info = (s: string) => `\x1b[36m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[90m${s}\x1b[0m`;
const label = (s: string) => `\x1b[35m\x1b[1m${s}\x1b[0m`;
const time = (s: string) => `\x1b[33m${s}\x1b[0m`;

export class ServerZKProvider implements ZKProvider {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    console.log(`${SERVER_TAG} Created — baseUrl: ${info(this.baseUrl)}`);
  }

  async init(): Promise<void> {
    console.log(`${SERVER_TAG} Health check → ${info(this.baseUrl + '/health')}`);
    const t0 = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) {
        throw new Error(`Health check failed: HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log(`${SERVER_TAG} Health: ${ok(JSON.stringify(data))} ${time(`(${Date.now() - t0}ms)`)}`);
      console.log(`${SERVER_TAG} ${ok('Provider ready ✓')}`);
    } catch (e: any) {
      console.error(`${SERVER_TAG} ${fail(`✗ Server unreachable: ${e.message}`)}`);
      throw new Error(`ZK server unreachable at ${this.baseUrl}: ${e.message}`);
    }
  }

  private async postProof<T>(endpoint: string, body: object, onProgress?: OnProgressCallback): Promise<T> {
    onProgress?.('Sending to proof server...');
    const t0 = Date.now();
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`${SERVER_TAG} ${info('POST')} ${dim(url)}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const elapsed = Date.now() - t0;
    const statusFn = res.ok ? ok : fail;
    console.log(`${SERVER_TAG} Response: ${statusFn(String(res.status))} ${time(`(${elapsed}ms)`)}`);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`${SERVER_TAG} ${fail(`✗ Server error: ${JSON.stringify(errData)}`)}`);
      throw new Error(`Server proof failed: ${errData.error || errData.details || res.statusText}`);
    }

    onProgress?.('Proof generated!');
    return res.json();
  }

  async boardValidity(
    input: BoardValidityInput,
    onProgress?: OnProgressCallback,
  ): Promise<BoardValidityResult> {
    console.log(`${SERVER_TAG} ${info('━━━ boardValidity() ━━━')}`);
    console.log(`${SERVER_TAG} ${label('Ships')}: ${JSON.stringify(input.ships)}`);
    console.log(`${SERVER_TAG} ${label('Nonce')}: ${input.nonce}`);

    const data = await this.postProof<{ proof: number[]; boardHash: string }>(
      '/api/prove/board-validity',
      { ships: input.ships, nonce: input.nonce },
      onProgress,
    );

    const proofBytes = new Uint8Array(data.proof);
    console.log(`${SERVER_TAG} ${ok('✓ Proof received')} — ${label('size')}: ${proofBytes.length} bytes, ${label('hash')}: ${info(data.boardHash)}`);
    return { proof: proofBytes, boardHash: data.boardHash };
  }

  async shotProof(
    input: ShotProofInput,
    onProgress?: OnProgressCallback,
  ): Promise<ShotProofResult> {
    console.log(`${SERVER_TAG} ${info('━━━ shotProof() ━━━')}`);
    console.log(`${SERVER_TAG} ${label('Shot')}: (${input.row}, ${input.col}) isHit=${input.isHit}`);

    const data = await this.postProof<{ proof: number[] }>(
      '/api/prove/shot-proof',
      {
        ships: input.ships,
        nonce: input.nonce,
        boardHash: input.boardHash,
        row: input.row,
        col: input.col,
        isHit: input.isHit,
      },
      onProgress,
    );

    const proofBytes = new Uint8Array(data.proof);
    console.log(`${SERVER_TAG} ${ok('✓ Proof received')} — ${label('size')}: ${proofBytes.length} bytes`);
    return { proof: proofBytes, isHit: input.isHit };
  }

  async turnsProof(
    input: TurnsProofInput,
    onProgress?: OnProgressCallback,
  ): Promise<TurnsProofResult> {
    console.log(`${SERVER_TAG} ${info('━━━ turnsProof() ━━━')}`);
    console.log(`${SERVER_TAG} ${label('Winner')}: ${input.winner === 0 ? 'player' : 'AI'}`);
    console.log(`${SERVER_TAG} ${label('Attacks')}: player=${input.attacksPlayer.length}, AI=${input.attacksAi.length}`);

    const data = await this.postProof<{ proof: number[] }>(
      '/api/prove/turns-proof',
      {
        shipsPlayer: input.shipsPlayer,
        shipsAi: input.shipsAi,
        noncePlayer: input.noncePlayer,
        nonceAi: input.nonceAi,
        boardHashPlayer: input.boardHashPlayer,
        boardHashAi: input.boardHashAi,
        attacksPlayer: input.attacksPlayer,
        attacksAi: input.attacksAi,
        nAttacksPlayer: input.attacksPlayer.length,
        nAttacksAi: input.attacksAi.length,
        shipSizes: input.shipSizes,
        winner: input.winner,
      },
      onProgress,
    );

    const proofBytes = new Uint8Array(data.proof);
    console.log(`${SERVER_TAG} ${ok('✓ Proof received')} — ${label('size')}: ${proofBytes.length} bytes`);
    return { proof: proofBytes, winner: input.winner };
  }

  destroy(): void {
    console.log(`${SERVER_TAG} ${dim('destroy() — no-op for server provider')}`);
  }
}
