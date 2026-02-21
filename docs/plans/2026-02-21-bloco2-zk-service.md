# Bloco 2: ZK Service Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a ZK proof service (zkService.ts) that generates and verifies board_validity, shot_proof, and turns_proof proofs using NoirJS in a WebView, with architecture ready to swap to native bindings.

**Architecture:** Abstract `ZKProvider` interface with `WebViewZKProvider` implementation. NoirJS + bb.js run inside an invisible WebView (Hermes can't run WASM). The WebView communicates with RN via `postMessage`/`onMessage`. Compiled circuit JSONs (ACIR) are bundled as assets.

**Tech Stack:** Noir 1.0.0-beta.18, @noir-lang/noir_js, @aztec/bb.js, react-native-webview (already installed), poseidon external dep (noir-lang/poseidon v0.2.6)

---

## Task 0: Fix Poseidon2 import in all circuits

The `std::hash::poseidon2` module is now private in Noir 1.0.0-beta.18. Poseidon2 must be imported as external dependency from `noir-lang/poseidon`.

**Files:**
- Modify: `circuits/board_validity/Nargo.toml`
- Modify: `circuits/board_validity/src/main.nr:1`
- Modify: `circuits/shot_proof/Nargo.toml`
- Modify: `circuits/shot_proof/src/main.nr:1`
- Modify: `circuits/turns_proof/Nargo.toml`
- Modify: `circuits/turns_proof/src/main.nr:1`

**Step 1: Add poseidon dependency to all 3 Nargo.toml files**

Each Nargo.toml gets:
```toml
[dependencies]
poseidon = { tag = "v0.2.6", git = "https://github.com/noir-lang/poseidon" }
```

**Step 2: Fix import in all 3 main.nr files**

Change:
```noir
use std::hash::poseidon2::Poseidon2;
```
To:
```noir
use poseidon::poseidon2::Poseidon2;
```

**Step 3: Run tests to verify all 14 still pass**

Run: `cd circuits/board_validity && nargo test && cd ../shot_proof && nargo test && cd ../turns_proof && nargo test`
Expected: 5 + 5 + 4 = 14 tests passing

**Step 4: Commit**

```bash
git add circuits/
git commit -m "fix(circuits): migrate poseidon2 to external dependency"
```

---

## Task 1: Compile circuits and generate JSON artifacts

**Files:**
- Create: `circuits/board_validity/target/board_validity.json` (generated)
- Create: `circuits/shot_proof/target/shot_proof.json` (generated)
- Create: `circuits/turns_proof/target/turns_proof.json` (generated)
- Create: `frontend/src/services/zk/circuits/board_validity.json` (copy)
- Create: `frontend/src/services/zk/circuits/shot_proof.json` (copy)
- Create: `frontend/src/services/zk/circuits/turns_proof.json` (copy)

**Step 1: Compile all 3 circuits**

Run:
```bash
cd circuits/board_validity && nargo compile
cd ../shot_proof && nargo compile
cd ../turns_proof && nargo compile
```
Expected: Each produces `target/<name>.json` with keys: `noir_version`, `hash`, `abi`, `bytecode`, `debug_symbols`, `file_map`, `expression_width`

**Step 2: Create circuits directory in frontend and copy JSONs**

```bash
mkdir -p frontend/src/services/zk/circuits
cp circuits/board_validity/target/board_validity.json frontend/src/services/zk/circuits/
cp circuits/shot_proof/target/shot_proof.json frontend/src/services/zk/circuits/
cp circuits/turns_proof/target/turns_proof.json frontend/src/services/zk/circuits/
```

**Step 3: Verify JSONs are valid**

```bash
node -e "const c = require('./frontend/src/services/zk/circuits/board_validity.json'); console.log('bytecode length:', c.bytecode.length, 'abi params:', c.abi.parameters.length)"
```
Expected: bytecode length > 0, abi params > 0

**Step 4: Commit**

```bash
git add frontend/src/services/zk/circuits/
git commit -m "feat(zk): add compiled circuit JSON artifacts"
```

---

## Task 2: Create ZK types and zkService interface

**Files:**
- Create: `frontend/src/services/zk/types.ts`
- Create: `frontend/src/services/zk/zkService.ts`

**Step 1: Create types.ts**

```typescript
// frontend/src/services/zk/types.ts

/** Ship tuple matching Noir circuit format: (row, col, size, horizontal) */
export type ShipTuple = [number, number, number, boolean];

/** Input for board_validity circuit */
export interface BoardValidityInput {
  ships: [ShipTuple, ShipTuple, ShipTuple];
  nonce: string; // Field as decimal string
}

/** Result from board_validity proof */
export interface BoardValidityResult {
  proof: Uint8Array;
  boardHash: string; // Field as hex string
}

/** Input for shot_proof circuit */
export interface ShotProofInput {
  ships: [ShipTuple, ShipTuple, ShipTuple];
  nonce: string;
  boardHash: string;
  row: number;
  col: number;
  isHit: boolean;
}

/** Result from shot_proof proof */
export interface ShotProofResult {
  proof: Uint8Array;
  isHit: boolean;
}

/** Input for turns_proof circuit */
export interface TurnsProofInput {
  shipsPlayer: [ShipTuple, ShipTuple, ShipTuple];
  shipsAI: [ShipTuple, ShipTuple, ShipTuple];
  noncePlayer: string;
  nonceAI: string;
  boardHashPlayer: string;
  boardHashAI: string;
  attacksPlayer: [number, number][];
  attacksAI: [number, number][];
  shipSizes: [number, number, number];
  winner: 0 | 1;
}

/** Result from turns_proof proof */
export interface TurnsProofResult {
  proof: Uint8Array;
  winner: 0 | 1;
}

/** Abstract ZK provider — swap implementation without changing consumers */
export interface ZKProvider {
  init(): Promise<void>;
  boardValidity(input: BoardValidityInput): Promise<BoardValidityResult>;
  shotProof(input: ShotProofInput): Promise<ShotProofResult>;
  turnsProof(input: TurnsProofInput): Promise<TurnsProofResult>;
  destroy(): void;
}
```

**Step 2: Create zkService.ts**

```typescript
// frontend/src/services/zk/zkService.ts

import type { ZKProvider, BoardValidityInput, BoardValidityResult, ShotProofInput, ShotProofResult, TurnsProofInput, TurnsProofResult } from './types';

let provider: ZKProvider | null = null;

export async function initZK(zkProvider: ZKProvider): Promise<void> {
  provider = zkProvider;
  await provider.init();
}

function getProvider(): ZKProvider {
  if (!provider) throw new Error('ZK not initialized. Call initZK() first.');
  return provider;
}

export async function boardValidity(input: BoardValidityInput): Promise<BoardValidityResult> {
  return getProvider().boardValidity(input);
}

export async function shotProof(input: ShotProofInput): Promise<ShotProofResult> {
  return getProvider().shotProof(input);
}

export async function turnsProof(input: TurnsProofInput): Promise<TurnsProofResult> {
  return getProvider().turnsProof(input);
}

export function destroyZK(): void {
  provider?.destroy();
  provider = null;
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep -i "services/zk"`
Expected: No errors from the zk files (other pre-existing errors are OK)

**Step 4: Commit**

```bash
git add frontend/src/services/zk/types.ts frontend/src/services/zk/zkService.ts
git commit -m "feat(zk): add ZKProvider interface and zkService facade"
```

---

## Task 3: Create WebView ZK worker (HTML page with NoirJS + bb.js)

This is the HTML page that runs inside the WebView. It loads NoirJS and bb.js via CDN, receives circuit JSON + inputs via postMessage, generates proofs, and sends results back.

**Files:**
- Create: `frontend/src/services/zk/webview/zkWorker.html`

**Step 1: Create the HTML worker**

```html
<!-- frontend/src/services/zk/webview/zkWorker.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script type="module">
    import { Noir } from 'https://esm.sh/@noir-lang/noir_js@1.0.0-beta.18';
    import { UltraHonkBackend } from 'https://esm.sh/@aztec/bb.js@0.82.2';

    const circuits = {};

    async function loadCircuit(name, circuitJson) {
      const noir = new Noir(circuitJson);
      const backend = new UltraHonkBackend(circuitJson.bytecode);
      circuits[name] = { noir, backend };
    }

    async function generateProof(name, inputs) {
      const { noir, backend } = circuits[name];
      const { witness } = await noir.execute(inputs);
      const proof = await backend.generateProof(witness);
      return proof;
    }

    window.addEventListener('message', async (event) => {
      const { id, action, payload } = JSON.parse(event.data);
      try {
        let result;
        if (action === 'loadCircuit') {
          await loadCircuit(payload.name, payload.circuit);
          result = { ok: true };
        } else if (action === 'generateProof') {
          const proof = await generateProof(payload.name, payload.inputs);
          result = {
            ok: true,
            proof: Array.from(proof.proof),
            publicInputs: proof.publicInputs
          };
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({ id, ...result }));
      } catch (err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          id,
          ok: false,
          error: err.message || String(err)
        }));
      }
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({ id: 'init', ok: true }));
  </script>
</head>
<body></body>
</html>
```

**Step 2: Commit**

```bash
git add frontend/src/services/zk/webview/zkWorker.html
git commit -m "feat(zk): add WebView ZK worker HTML page"
```

**NOTE:** This file cannot be tested in isolation yet. It will be validated in Task 4 when integrated with the WebViewZKProvider.

---

## Task 4: Create WebViewZKProvider with boardValidity (E4)

**Files:**
- Create: `frontend/src/services/zk/webview/WebViewZKProvider.tsx`

**Step 1: Create the provider component**

The WebViewZKProvider renders an invisible WebView, loads circuits on init, and proxies proof generation requests through postMessage.

```typescript
// frontend/src/services/zk/webview/WebViewZKProvider.tsx

import React, { useRef, useCallback, useEffect, useState } from 'react';
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

import boardValidityCircuit from '../circuits/board_validity.json';

const HTML_SOURCE = require('./zkWorker.html');

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
};

let requestId = 0;
const pending = new Map<string, PendingRequest>();
let webviewRef: WebView | null = null;
let readyResolve: (() => void) | null = null;
const readyPromise = new Promise<void>((res) => { readyResolve = res; });

function sendMessage(action: string, payload: any): Promise<any> {
  const id = String(++requestId);
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    webviewRef?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', {
        data: ${JSON.stringify(JSON.stringify({ id, action, payload }))}
      }));
      true;
    `);
  });
}

function handleMessage(event: WebViewMessageEvent) {
  const data = JSON.parse(event.nativeEvent.data);
  if (data.id === 'init') {
    readyResolve?.();
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

/** Invisible WebView component — render this once at app root */
export function ZKWebView() {
  return (
    <View style={{ height: 0, width: 0, position: 'absolute' }}>
      <WebView
        ref={(ref) => { webviewRef = ref; }}
        source={HTML_SOURCE}
        onMessage={handleMessage}
        javaScriptEnabled
        originWhitelist={['*']}
      />
    </View>
  );
}

/** WebView-based ZK provider */
export const webViewZKProvider: ZKProvider = {
  async init() {
    await readyPromise;
    await sendMessage('loadCircuit', {
      name: 'board_validity',
      circuit: boardValidityCircuit,
    });
  },

  async boardValidity(input: BoardValidityInput): Promise<BoardValidityResult> {
    // Convert ShipTuples to Noir circuit input format
    // Circuit expects: ships: [(u8,u8,u8,bool);3], nonce: Field, board_hash: pub Field, ship_sizes: pub [u8;3]
    // We need to compute board_hash client-side to pass as public input
    // For now, pass ships + nonce and let the circuit compute internally
    const ships = input.ships.map(([r, c, s, h]) => ({
      '0': String(r),
      '1': String(c),
      '2': String(s),
      '3': h ? '1' : '0',
    }));

    const circuitInput = {
      ships,
      nonce: input.nonce,
      board_hash: '0', // placeholder — needs Poseidon2 hash computed in WebView
      ship_sizes: input.ships.map(([_, __, s]) => String(s)),
    };

    const result = await sendMessage('generateProof', {
      name: 'board_validity',
      inputs: circuitInput,
    });

    return {
      proof: new Uint8Array(result.proof),
      boardHash: result.publicInputs?.[0] ?? '',
    };
  },

  async shotProof(_input: ShotProofInput): Promise<ShotProofResult> {
    throw new Error('shotProof not implemented yet (Task 5)');
  },

  async turnsProof(_input: TurnsProofInput): Promise<TurnsProofResult> {
    throw new Error('turnsProof not implemented yet (Task 6)');
  },

  destroy() {
    webviewRef = null;
    pending.clear();
  },
};
```

**NOTE:** The `board_hash` computation is a chicken-and-egg problem: the hash is computed inside the circuit using Poseidon2, but it's also a public input. We need to either:
- (a) Compute Poseidon2 in JS too (via bb.js or a JS Poseidon2 lib), or
- (b) Use a 2-pass approach: execute circuit first to get the hash, then prove.

The NoirJS `noir.execute()` returns the witness which includes computed values. The correct approach is: **execute first to get the witness (which computes board_hash), then generate proof from that witness.** The `board_hash` public input must match what the circuit computes — so we pass it in and the circuit asserts equality.

This will likely need iteration during validation. The key thing is the plumbing works.

**Step 2: Validate by rendering ZKWebView and calling boardValidity**

Create a temporary test button in any screen (e.g. menu.tsx) that calls:
```typescript
import { initZK, boardValidity } from '../src/services/zk/zkService';
import { webViewZKProvider } from '../src/services/zk/webview/WebViewZKProvider';

// On mount:
await initZK(webViewZKProvider);

// On press:
const result = await boardValidity({
  ships: [[0, 0, 2, true], [2, 0, 2, true], [4, 0, 3, true]],
  nonce: '12345',
});
console.log('Proof generated!', result.proof.length);
```

Expected: Console shows proof generated with non-zero length (may take 30-40s)

**Step 3: Commit**

```bash
git add frontend/src/services/zk/webview/
git commit -m "feat(zk): add WebViewZKProvider with boardValidity (E4)"
```

---

## Task 5: Add shotProof to WebViewZKProvider (E5)

**Files:**
- Modify: `frontend/src/services/zk/webview/WebViewZKProvider.tsx`

**Step 1: Load shot_proof circuit on init**

Add to `init()`:
```typescript
import shotProofCircuit from '../circuits/shot_proof.json';

// in init():
await sendMessage('loadCircuit', { name: 'shot_proof', circuit: shotProofCircuit });
```

**Step 2: Implement shotProof method**

```typescript
async shotProof(input: ShotProofInput): Promise<ShotProofResult> {
  const ships = input.ships.map(([r, c, s, h]) => ({
    '0': String(r),
    '1': String(c),
    '2': String(s),
    '3': h ? '1' : '0',
  }));

  const circuitInput = {
    ships,
    nonce: input.nonce,
    board_hash: input.boardHash,
    row: String(input.row),
    col: String(input.col),
    is_hit: input.isHit ? '1' : '0',
  };

  const result = await sendMessage('generateProof', {
    name: 'shot_proof',
    inputs: circuitInput,
  });

  return {
    proof: new Uint8Array(result.proof),
    isHit: input.isHit,
  };
},
```

**Step 3: Validate**

```typescript
const shotResult = await shotProof({
  ships: [[0, 0, 2, true], [2, 0, 2, true], [4, 0, 3, true]],
  nonce: '42',
  boardHash: '<hash from boardValidity result>',
  row: 0, col: 0,
  isHit: true,
});
console.log('Shot proof!', shotResult.proof.length);
```

**Step 4: Commit**

```bash
git add frontend/src/services/zk/webview/WebViewZKProvider.tsx
git commit -m "feat(zk): add shotProof to WebViewZKProvider (E5)"
```

---

## Task 6: Add turnsProof to WebViewZKProvider (E6)

**Files:**
- Modify: `frontend/src/services/zk/webview/WebViewZKProvider.tsx`

**Step 1: Load turns_proof circuit on init**

```typescript
import turnsProofCircuit from '../circuits/turns_proof.json';

// in init():
await sendMessage('loadCircuit', { name: 'turns_proof', circuit: turnsProofCircuit });
```

**Step 2: Implement turnsProof method**

```typescript
async turnsProof(input: TurnsProofInput): Promise<TurnsProofResult> {
  const toShips = (s: [number, number, number, boolean][]) =>
    s.map(([r, c, sz, h]) => ({
      '0': String(r),
      '1': String(c),
      '2': String(sz),
      '3': h ? '1' : '0',
    }));

  // Pad attacks to 36 entries (6x6 grid)
  const padAttacks = (attacks: [number, number][]) => {
    const padded = Array.from({ length: 36 }, () => ({ '0': '0', '1': '0' }));
    attacks.forEach(([r, c], i) => {
      padded[i] = { '0': String(r), '1': String(c) };
    });
    return padded;
  };

  const circuitInput = {
    ships_player: toShips(input.shipsPlayer),
    ships_ai: toShips(input.shipsAI),
    nonce_player: input.noncePlayer,
    nonce_ai: input.nonceAI,
    board_hash_player: input.boardHashPlayer,
    board_hash_ai: input.boardHashAI,
    attacks_player: padAttacks(input.attacksPlayer),
    attacks_ai: padAttacks(input.attacksAI),
    n_attacks_player: String(input.attacksPlayer.length),
    n_attacks_ai: String(input.attacksAI.length),
    ship_sizes: input.shipSizes.map(String),
    winner: String(input.winner),
  };

  const result = await sendMessage('generateProof', {
    name: 'turns_proof',
    inputs: circuitInput,
  });

  return {
    proof: new Uint8Array(result.proof),
    winner: input.winner,
  };
},
```

**Step 3: Validate**

Test with the same ship configurations from circuit tests.

**Step 4: Commit**

```bash
git add frontend/src/services/zk/webview/WebViewZKProvider.tsx
git commit -m "feat(zk): add turnsProof to WebViewZKProvider (E6)"
```

---

## Known Risks & Mitigations

1. **Poseidon2 board_hash chicken-and-egg**: The circuit expects `board_hash` as public input, but it's computed via Poseidon2 inside the circuit. We need to either compute it in JS (using bb.js Poseidon2) or restructure the circuit to return it. Will be resolved during Task 4 validation.

2. **NoirJS CDN versions**: The esm.sh CDN URLs for `@noir-lang/noir_js` and `@aztec/bb.js` must match the Noir compiler version (1.0.0-beta.18). Version mismatch will cause ACIR deserialization errors.

3. **WebView WASM loading time**: First proof will be slow (~30-40s) due to WASM initialization. Subsequent proofs should be faster (~10-15s). This is acceptable for validation; native bindings will solve perf.

4. **Circuit JSON size**: Compiled JSONs may be large (100KB+). For the WebView approach we send them via postMessage which should handle this, but watch for memory issues.

5. **React Native WebView quirks**: `require('./zkWorker.html')` may need Metro bundler config to handle HTML assets. Alternative: inline the HTML as a string template.
