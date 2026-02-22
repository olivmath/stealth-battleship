import React from 'react';
import { View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import type {
  ZKProvider,
  BoardValidityInput,
  BoardValidityResult,
  ShotProofInput,
  ShotProofResult,
  TurnsProofInput,
  TurnsProofResult,
  ShipTuples,
  OnProgressCallback,
} from './entities';
import { MAX_ATTACKS } from './entities';
import { ZK_WORKER_HTML } from './zkWorkerHtml';

import boardValidityCircuit from './circuits/board_validity.json';
import hashHelperCircuit from './circuits/hash_helper.json';
import shotProofCircuit from './circuits/shot_proof.json';
import turnsProofCircuit from './circuits/turns_proof.json';

// ─── Shared helpers ─────────────────────────────────────────────────

function toNoirShips(ships: ShipTuples) {
  return ships.map(([r, c, s, h]) => [String(r), String(c), String(s), h]);
}

function padAttacks(attacks: [number, number][]): [string, string][] {
  const padded: [string, string][] = attacks.map(([r, c]) => [String(r), String(c)]);
  while (padded.length < MAX_ATTACKS) {
    padded.push(['0', '0']);
  }
  return padded;
}

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

// ─── WebView ZK Provider ─────────────────────────────────────────────

const WV_TAG = '[ZK]';

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
};

let requestId = 0;
const pending = new Map<string, PendingRequest>();
let webviewRef: WebView | null = null;
let readyResolve: (() => void) | null = null;
let readyReject: ((err: Error) => void) | null = null;
let readyPromise: Promise<void> | null = null;

function resetReady() {
  readyPromise = new Promise<void>((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
}
resetReady();

function sendToWebView(action: string, payload: any): Promise<any> {
  const id = String(++requestId);
  console.log(`${WV_TAG} → WebView [${id}] action=${action}`);
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    const message = JSON.stringify({ id, action, payload });
    webviewRef?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', {
        data: ${JSON.stringify(message)}
      }));
      true;
    `);
  });
}

function handleMessage(event: WebViewMessageEvent) {
  let data: any;
  try {
    data = JSON.parse(event.nativeEvent.data);
  } catch {
    return;
  }

  if (data.id === 'log') {
    console.log(`${WV_TAG} [WebView]`, data.message);
    return;
  }

  if (data.id === 'init') {
    if (data.ok) {
      console.log(`${WV_TAG} WebView initialized ✓`);
      readyResolve?.();
    } else {
      console.error(`${WV_TAG} WebView init FAILED:`, data.error);
      readyReject?.(new Error(data.error));
    }
    return;
  }

  const req = pending.get(data.id);
  if (!req) return;
  pending.delete(data.id);

  if (data.ok) {
    console.log(`${WV_TAG} ← WebView [${data.id}] OK`);
    req.resolve(data);
  } else {
    console.error(`${WV_TAG} ← WebView [${data.id}] ERROR:`, data.error);
    req.reject(new Error(data.error));
  }
}

/** Invisible WebView component — render once at app root */
export function ZKWebView() {
  return (
    <View style={{ height: 0, width: 0, position: 'absolute', opacity: 0 }}>
      <WebView
        ref={(ref) => {
          webviewRef = ref;
        }}
        source={{ html: ZK_WORKER_HTML }}
        onMessage={handleMessage}
        javaScriptEnabled
        originWhitelist={['*']}
        onError={(e) => {
          console.error(`${WV_TAG} WebView error:`, e.nativeEvent.description);
          readyReject?.(new Error(e.nativeEvent.description));
        }}
      />
    </View>
  );
}

/** Print a 10x10 board matrix from ship tuples */
function logBoardMatrix(ships: ShipTuples) {
  const grid: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
  for (const [row, col, size, horizontal] of ships) {
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      if (r < 10 && c < 10) grid[r][c] = 1;
    }
  }
  console.log(`${WV_TAG}   Board matrix (1=ship, 0=water):`);
  console.log(`${WV_TAG}     A B C D E F G H I J`);
  grid.forEach((row, i) => {
    console.log(`${WV_TAG}   ${String(i + 1).padStart(2)} ${row.join(' ')}`);
  });
}

/** WebView-based ZK provider */
export const webViewZKProvider: ZKProvider = {
  async init() {
    console.log(`${WV_TAG} Waiting for WebView to initialize...`);
    await readyPromise;

    const t0 = Date.now();
    console.log(`${WV_TAG} Loading circuits...`);
    await Promise.all([
      sendToWebView('loadCircuit', { name: 'hash_helper', circuit: hashHelperCircuit }),
      sendToWebView('loadCircuit', { name: 'board_validity', circuit: boardValidityCircuit }),
      sendToWebView('loadCircuit', { name: 'shot_proof', circuit: shotProofCircuit }),
      sendToWebView('loadCircuit', { name: 'turns_proof', circuit: turnsProofCircuit }),
    ]);
    console.log(`${WV_TAG} Circuits loaded (${Date.now() - t0}ms)`);
  },

  async boardValidity(input: BoardValidityInput, onProgress?: OnProgressCallback): Promise<BoardValidityResult> {
    console.log(`${WV_TAG} boardValidity() called`);
    console.log(`${WV_TAG}   ships:`, JSON.stringify(input.ships));
    console.log(`${WV_TAG}   nonce:`, input.nonce);
    logBoardMatrix(input.ships);

    const ships = toNoirShips(input.ships);
    const shipSizes = input.ships.map(([, , s]) => String(s));

    onProgress?.('1/2 — Computing board hash...');
    console.log(`${WV_TAG}   [1/2] Computing board hash (Poseidon2)...`);
    const t0 = Date.now();

    const hashResult = await sendToWebView('execute', {
      name: 'hash_helper',
      inputs: { ships, nonce: input.nonce },
    });
    const boardHash = hashResult.returnValue;
    console.log(`${WV_TAG}   [1/2] Board hash computed (${Date.now() - t0}ms): ${boardHash}`);

    onProgress?.('2/2 — Generating proof...');
    console.log(`${WV_TAG}   [2/2] Generating board_validity proof...`);
    const t1 = Date.now();

    const result = await sendToWebView('executeAndProve', {
      name: 'board_validity',
      inputs: {
        ships,
        nonce: input.nonce,
        board_hash: boardHash,
        ship_sizes: shipSizes,
      },
    });

    const proofBytes = new Uint8Array(result.proof);
    console.log(`${WV_TAG}   [2/2] Proof generated! (${Date.now() - t1}ms) — ${proofBytes.length} bytes`);

    return { proof: proofBytes, boardHash };
  },

  async shotProof(input: ShotProofInput, onProgress?: OnProgressCallback): Promise<ShotProofResult> {
    console.log(`${WV_TAG} shotProof() called`);
    console.log(`${WV_TAG}   shot: (${input.row}, ${input.col}) isHit=${input.isHit}`);
    logBoardMatrix(input.ships);

    const ships = toNoirShips(input.ships);

    onProgress?.('Generating shot proof...');
    console.log(`${WV_TAG}   Generating shot_proof...`);
    const t0 = Date.now();

    const result = await sendToWebView('executeAndProve', {
      name: 'shot_proof',
      inputs: {
        ships,
        nonce: input.nonce,
        board_hash: input.boardHash,
        row: String(input.row),
        col: String(input.col),
        is_hit: input.isHit,
      },
    });

    const proofBytes = new Uint8Array(result.proof);
    console.log(`${WV_TAG}   Proof generated! (${Date.now() - t0}ms) — ${proofBytes.length} bytes`);

    onProgress?.('Proof generated!');
    return { proof: proofBytes, isHit: input.isHit };
  },

  async turnsProof(input: TurnsProofInput, onProgress?: OnProgressCallback): Promise<TurnsProofResult> {
    console.log(`${WV_TAG} turnsProof() called`);
    console.log(`${WV_TAG}   winner: ${input.winner === 0 ? 'player' : 'AI'}`);
    console.log(`${WV_TAG}   attacks: player=${input.attacksPlayer.length}, AI=${input.attacksAi.length}`);

    onProgress?.('Generating game result proof...');
    console.log(`${WV_TAG}   Generating turns_proof...`);
    const t0 = Date.now();

    const result = await sendToWebView('executeAndProve', {
      name: 'turns_proof',
      inputs: {
        ships_player: toNoirShips(input.shipsPlayer),
        ships_ai: toNoirShips(input.shipsAi),
        nonce_player: input.noncePlayer,
        nonce_ai: input.nonceAi,
        board_hash_player: input.boardHashPlayer,
        board_hash_ai: input.boardHashAi,
        attacks_player: padAttacks(input.attacksPlayer),
        attacks_ai: padAttacks(input.attacksAi),
        n_attacks_player: String(input.attacksPlayer.length),
        n_attacks_ai: String(input.attacksAi.length),
        ship_sizes: input.shipSizes.map(String),
        winner: String(input.winner),
      },
    });

    const proofBytes = new Uint8Array(result.proof);
    console.log(`${WV_TAG}   Proof generated! (${Date.now() - t0}ms) — ${proofBytes.length} bytes`);

    onProgress?.('Proof generated!');
    return { proof: proofBytes, winner: input.winner };
  },

  destroy() {
    console.log(`${WV_TAG} destroy()`);
    webviewRef = null;
    pending.clear();
    resetReady();
  },
};
