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
} from '../types';
import { ZK_WORKER_HTML } from './zkWorkerHtml';

import boardValidityCircuit from '../circuits/board_validity.json';
import hashHelperCircuit from '../circuits/hash_helper.json';

const TAG = '[ZK]';

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
  console.log(`${TAG} → WebView [${id}] action=${action}`);
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
    console.log(`${TAG} [WebView]`, data.message);
    return;
  }

  if (data.id === 'init') {
    if (data.ok) {
      console.log(`${TAG} WebView initialized ✓`);
      readyResolve?.();
    } else {
      console.error(`${TAG} WebView init FAILED:`, data.error);
      readyReject?.(new Error(data.error));
    }
    return;
  }

  const req = pending.get(data.id);
  if (!req) return;
  pending.delete(data.id);

  if (data.ok) {
    console.log(`${TAG} ← WebView [${data.id}] OK`);
    req.resolve(data);
  } else {
    console.error(`${TAG} ← WebView [${data.id}] ERROR:`, data.error);
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
          console.error(`${TAG} WebView error:`, e.nativeEvent.description);
          readyReject?.(new Error(e.nativeEvent.description));
        }}
      />
    </View>
  );
}

/** Convert ShipTuples to NoirJS input format: tuple = JS array */
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
  console.log(`${TAG}   Board matrix (1=ship, 0=water):`);
  console.log(`${TAG}     A B C D E F`);
  grid.forEach((row, i) => {
    console.log(`${TAG}   ${i + 1} ${row.join(' ')}`);
  });
}

/** WebView-based ZK provider */
export const webViewZKProvider: ZKProvider = {
  async init() {
    console.log(`${TAG} Waiting for WebView to initialize...`);
    await readyPromise;

    const t0 = Date.now();
    console.log(`${TAG} Loading circuits...`);
    await Promise.all([
      sendToWebView('loadCircuit', { name: 'hash_helper', circuit: hashHelperCircuit }),
      sendToWebView('loadCircuit', { name: 'board_validity', circuit: boardValidityCircuit }),
    ]);
    console.log(`${TAG} Circuits loaded (${Date.now() - t0}ms)`);
  },

  async boardValidity(input: BoardValidityInput, onProgress?: OnProgressCallback): Promise<BoardValidityResult> {
    console.log(`${TAG} boardValidity() called`);
    console.log(`${TAG}   ships:`, JSON.stringify(input.ships));
    console.log(`${TAG}   nonce:`, input.nonce);
    logBoardMatrix(input.ships);

    const ships = toNoirShips(input.ships);
    const shipSizes = input.ships.map(([, , s]) => String(s));

    // Step 1: Compute board hash using hash_helper circuit
    onProgress?.('1/2 — Computing board hash...');
    console.log(`${TAG}   [1/2] Computing board hash (Poseidon2)...`);
    const t0 = Date.now();

    const hashResult = await sendToWebView('execute', {
      name: 'hash_helper',
      inputs: { ships, nonce: input.nonce },
    });
    const boardHash = hashResult.returnValue;
    console.log(`${TAG}   [1/2] Board hash computed (${Date.now() - t0}ms): ${boardHash}`);

    // Step 2: Generate proof with the correct hash
    onProgress?.('2/2 — Generating proof...');
    console.log(`${TAG}   [2/2] Generating board_validity proof...`);
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
    console.log(`${TAG}   [2/2] Proof generated! (${elapsed}ms)`);
    console.log(`${TAG}   Proof size: ${proofBytes.length} bytes`);

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
    console.log(`${TAG} destroy()`);
    webviewRef = null;
    pending.clear();
    resetReady();
  },
};
