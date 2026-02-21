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
} from '../types';
import { ZK_WORKER_HTML } from './zkWorkerHtml';

import boardValidityCircuit from '../circuits/board_validity.json';

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

function toNoirShips(
  ships: [
    [number, number, number, boolean],
    [number, number, number, boolean],
    [number, number, number, boolean],
  ],
) {
  return ships.map(([r, c, s, h]) => ({
    '0': String(r),
    '1': String(c),
    '2': String(s),
    '3': h ? '1' : '0',
  }));
}

/** WebView-based ZK provider */
export const webViewZKProvider: ZKProvider = {
  async init() {
    console.log(`${TAG} Waiting for WebView to initialize...`);
    await readyPromise;
    console.log(`${TAG} Loading board_validity circuit...`);
    const t0 = Date.now();
    await sendToWebView('loadCircuit', {
      name: 'board_validity',
      circuit: boardValidityCircuit,
    });
    console.log(`${TAG} board_validity loaded (${Date.now() - t0}ms)`);
  },

  async boardValidity(input: BoardValidityInput): Promise<BoardValidityResult> {
    console.log(`${TAG} boardValidity() called`);
    console.log(`${TAG}   ships:`, JSON.stringify(input.ships));
    console.log(`${TAG}   nonce:`, input.nonce);

    const ships = toNoirShips(input.ships);
    const shipSizes = input.ships.map(([, , s]) => String(s));

    // Step 1: Execute circuit to compute board_hash via Poseidon2
    // We pass a dummy board_hash — the circuit will compute the real one
    // but fail the assertion. We use 'execute' which doesn't need assertion to pass
    // to extract the computed hash from the witness.
    //
    // Actually, noir.execute() DOES enforce assertions. So we need to compute
    // the hash correctly. The approach: we add a computeHash helper in the worker,
    // OR we use a separate tiny circuit. For now, let's try passing the inputs
    // and see if the circuit can execute.
    //
    // Alternative: compute Poseidon2 hash in JS matching the circuit's encoding.
    // The circuit encodes: [r0,c0,s0,h0, r1,c1,s1,h1, r2,c2,s2,h2, nonce] = 13 Fields
    // then Poseidon2::hash(inputs, 13)
    //
    // For the WebView approach, we'll add a 'computeHash' action that runs
    // the Poseidon2 computation via a helper circuit or direct noir execution.
    //
    // PRAGMATIC APPROACH for testing:
    // Pass all inputs including a placeholder hash.
    // If execute fails with hash mismatch, we know the plumbing works.
    // Then we'll fix the hash computation.

    const circuitInput = {
      ships,
      nonce: input.nonce,
      board_hash: '0', // Will fail assertion — this is expected for first test
      ship_sizes: shipSizes,
    };

    const t0 = Date.now();
    console.log(`${TAG}   Generating proof...`);

    try {
      const result = await sendToWebView('generateProof', {
        name: 'board_validity',
        inputs: circuitInput,
      });

      const elapsed = Date.now() - t0;
      const proofBytes = new Uint8Array(result.proof);
      console.log(`${TAG}   Proof generated! (${elapsed}ms)`);
      console.log(`${TAG}   Proof size: ${proofBytes.length} bytes`);
      console.log(`${TAG}   Public inputs:`, result.publicInputs);

      return {
        proof: proofBytes,
        boardHash: result.publicInputs?.[0] ?? '',
      };
    } catch (err: any) {
      const elapsed = Date.now() - t0;
      console.error(`${TAG}   Proof generation FAILED (${elapsed}ms):`, err.message);
      throw err;
    }
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
