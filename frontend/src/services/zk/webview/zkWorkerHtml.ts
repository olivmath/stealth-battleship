/**
 * Inline HTML for the ZK WebView worker.
 * Loads NoirJS + bb.js via CDN, generates proofs via postMessage protocol.
 *
 * Protocol:
 *   RN → WebView: { id, action: 'loadCircuit'|'generateProof'|'execute', payload }
 *   WebView → RN: { id, ok: true, ...result } | { id, ok: false, error }
 *
 * WASM Init Sequence:
 *   1. Import acvm_js, noirc_abi, noir_js, bb.js modules
 *   2. Call initACVM() and initNoirC() with WASM binaries (wasm-bindgen requirement)
 *   3. Only then create Noir/UltraHonkBackend instances
 */
export const ZK_WORKER_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
<script type="module">
  const VERSION = '1.0.0-beta.18';
  const BB_VERSION = '3.0.0-nightly.20251104';

  const ACVM_JS_URL = 'https://esm.sh/@noir-lang/acvm_js@' + VERSION;
  const NOIRC_ABI_URL = 'https://esm.sh/@noir-lang/noirc_abi@' + VERSION;
  const NOIR_JS_URL = 'https://esm.sh/@noir-lang/noir_js@' + VERSION;
  const BB_JS_URL = 'https://esm.sh/@aztec/bb.js@' + BB_VERSION;

  const ACVM_WASM_URL = 'https://esm.sh/@noir-lang/acvm_js@' + VERSION + '/web/acvm_js_bg.wasm';
  const NOIRC_WASM_URL = 'https://esm.sh/@noir-lang/noirc_abi@' + VERSION + '/web/noirc_abi_wasm_bg.wasm';

  let Noir, UltraHonkBackend;
  const circuits = {};

  function send(msg) {
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }

  function log(msg) {
    send({ id: 'log', ok: true, message: msg });
  }

  // iOS WKWebView fetch polyfill for .wasm files (MIME type workaround)
  const originalFetch = window.fetch;
  window.fetch = async function(url, opts) {
    if (typeof url === 'string' && url.endsWith('.wasm')) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => resolve(new Response(
          xhr.response,
          { headers: { 'Content-Type': 'application/wasm' } }
        ));
        xhr.onerror = () => reject(new Error('WASM fetch failed: ' + url));
        xhr.send();
      });
    }
    return originalFetch(url, opts);
  };

  async function initialize() {
    try {
      log('Loading JS modules...');

      // Step 1: Load all JS modules in parallel
      const [acvmModule, noircModule, noirModule, bbModule] = await Promise.all([
        import(ACVM_JS_URL),
        import(NOIRC_ABI_URL),
        import(NOIR_JS_URL),
        import(BB_JS_URL),
      ]);

      log('JS modules loaded. Initializing WASM...');

      // Step 2: Initialize wasm-bindgen modules (MUST happen before using Noir)
      await Promise.all([
        acvmModule.default(fetch(ACVM_WASM_URL)),
        noircModule.default(fetch(NOIRC_WASM_URL)),
      ]);

      log('WASM initialized.');

      // Step 3: Assign classes — now safe to use
      Noir = noirModule.Noir;
      UltraHonkBackend = bbModule.UltraHonkBackend;

      send({ id: 'init', ok: true });
    } catch (err) {
      send({ id: 'init', ok: false, error: 'Init failed: ' + (err.message || err) });
    }
  }

  async function loadCircuit(name, circuitJson) {
    const noir = new Noir(circuitJson);
    const backend = new UltraHonkBackend(circuitJson.bytecode);
    circuits[name] = { noir, backend };
  }

  async function executeOnly(name, inputs) {
    const { noir } = circuits[name];
    const { witness, returnValue } = await noir.execute(inputs);
    return { witness, returnValue };
  }

  async function generateProof(name, inputs) {
    const { noir, backend } = circuits[name];
    const { witness } = await noir.execute(inputs);
    const proof = await backend.generateProof(witness);
    return proof;
  }

  window.addEventListener('message', async (event) => {
    let parsed;
    try {
      parsed = JSON.parse(event.data);
    } catch {
      return;
    }

    const { id, action, payload } = parsed;
    if (!id || !action) return;

    try {
      let result;
      if (action === 'loadCircuit') {
        await loadCircuit(payload.name, payload.circuit);
        result = { ok: true };
      } else if (action === 'execute') {
        const { witness, returnValue } = await executeOnly(payload.name, payload.inputs);
        result = { ok: true, returnValue };
      } else if (action === 'generateProof') {
        const proof = await generateProof(payload.name, payload.inputs);
        result = {
          ok: true,
          proof: Array.from(proof.proof),
          publicInputs: proof.publicInputs,
        };
      } else {
        result = { ok: false, error: 'Unknown action: ' + action };
      }
      send({ id, ...result });
    } catch (err) {
      send({ id, ok: false, error: err.message || String(err) });
    }
  });

  initialize();
</script>
</body>
</html>
`;
