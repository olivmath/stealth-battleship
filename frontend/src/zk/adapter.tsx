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
  OnProgressCallback,
} from './entities';
import { ZK_WORKER_HTML } from './zkWorkerHtml';

import boardValidityCircuit from './circuits/board_validity.json';
import hashHelperCircuit from './circuits/hash_helper.json';

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

  async boardValidity(
    input: BoardValidityInput,
    onProgress?: OnProgressCallback,
  ): Promise<BoardValidityResult> {
    console.log(`${SERVER_TAG} ${info('━━━ boardValidity() ━━━')}`);
    console.log(`${SERVER_TAG} ${label('Ships')}: ${JSON.stringify(input.ships)}`);
    console.log(`${SERVER_TAG} ${label('Nonce')}: ${input.nonce}`);

    onProgress?.('Sending to proof server...');
    const t0 = Date.now();

    const url = `${this.baseUrl}/api/prove/board-validity`;
    console.log(`${SERVER_TAG} ${info('POST')} ${dim(url)}`);

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
    console.log(`${SERVER_TAG} Response: ${statusFn(String(res.status))} ${time(`(${elapsed}ms)`)}`);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`${SERVER_TAG} ${fail(`✗ Server error: ${JSON.stringify(errData)}`)}`);
      throw new Error(`Server proof failed: ${errData.error || errData.details || res.statusText}`);
    }

    const data = await res.json();
    const proofBytes = new Uint8Array(data.proof);

    console.log(`${SERVER_TAG} ${ok('✓ Proof received')}`);
    console.log(`${SERVER_TAG} ${label('Proof size')}: ${proofBytes.length} bytes`);
    console.log(`${SERVER_TAG} ${label('Board hash')}: ${info(data.boardHash)}`);
    console.log(`${SERVER_TAG} ${label('Total time')}: ${time(`${elapsed}ms`)}`);
    console.log(`${SERVER_TAG} ${info('━━━━━━━━━━━━━━━━━━━━━━━')}`);

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

/** Convert ShipTuples to NoirJS input format */
function toNoirShips(
  ships: [
    [number, number, number, boolean],
    [number, number, number, boolean],
    [number, number, number, boolean],
  ],
) {
  return ships.map(([r, c, s, h]) => [String(r), String(c), String(s), h]);
}

/** Print a 6x6 board matrix from ship tuples */
function logBoardMatrix(
  ships: [
    [number, number, number, boolean],
    [number, number, number, boolean],
    [number, number, number, boolean],
  ],
) {
  const grid: number[][] = Array.from({ length: 6 }, () => Array(6).fill(0));
  for (const [row, col, size, horizontal] of ships) {
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      if (r < 6 && c < 6) grid[r][c] = 1;
    }
  }
  console.log(`${WV_TAG}   Board matrix (1=ship, 0=water):`);
  console.log(`${WV_TAG}     A B C D E F`);
  grid.forEach((row, i) => {
    console.log(`${WV_TAG}   ${i + 1} ${row.join(' ')}`);
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

    const circuitInput = {
      ships,
      nonce: input.nonce,
      board_hash: boardHash,
      ship_sizes: shipSizes,
    };

    const result = await sendToWebView('executeAndProve', {
      name: 'board_validity',
      inputs: circuitInput,
    });

    const elapsed = Date.now() - t1;
    const proofBytes = new Uint8Array(result.proof);
    console.log(`${WV_TAG}   [2/2] Proof generated! (${elapsed}ms)`);
    console.log(`${WV_TAG}   Proof size: ${proofBytes.length} bytes`);

    return {
      proof: proofBytes,
      boardHash,
    };
  },

  async shotProof(_input: ShotProofInput): Promise<ShotProofResult> {
    throw new Error('shotProof not implemented yet');
  },

  async turnsProof(_input: TurnsProofInput): Promise<TurnsProofResult> {
    throw new Error('turnsProof not implemented yet');
  },

  destroy() {
    console.log(`${WV_TAG} destroy()`);
    webviewRef = null;
    pending.clear();
    resetReady();
  },
};
