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
      readyResolve?.();
    } else {
      readyReject?.(new Error(data.error));
    }
    return;
  }

  const req = pending.get(data.id);
  if (!req) return;
  pending.delete(data.id);

  if (data.ok) {
    req.resolve(data);
  } else {
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
          console.error('[ZKWebView] error:', e.nativeEvent.description);
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
    await readyPromise;
    await sendToWebView('loadCircuit', {
      name: 'board_validity',
      circuit: boardValidityCircuit,
    });
  },

  async boardValidity(input: BoardValidityInput): Promise<BoardValidityResult> {
    const circuitInput = {
      ships: toNoirShips(input.ships),
      nonce: input.nonce,
      board_hash: input.nonce, // placeholder — will be replaced with actual Poseidon2 hash
      ship_sizes: input.ships.map(([, , s]) => String(s)),
    };

    const result = await sendToWebView('generateProof', {
      name: 'board_validity',
      inputs: circuitInput,
    });

    return {
      proof: new Uint8Array(result.proof),
      boardHash: result.publicInputs?.[0] ?? '',
    };
  },

  async shotProof(_input: ShotProofInput): Promise<ShotProofResult> {
    throw new Error('shotProof not implemented yet');
  },

  async turnsProof(_input: TurnsProofInput): Promise<TurnsProofResult> {
    throw new Error('turnsProof not implemented yet');
  },

  destroy() {
    webviewRef = null;
    pending.clear();
    resetReady();
  },
};
