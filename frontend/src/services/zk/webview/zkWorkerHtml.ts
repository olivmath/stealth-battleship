/**
 * Inline HTML for the ZK WebView worker.
 * Loads NoirJS + bb.js via CDN, generates proofs via postMessage protocol.
 *
 * Protocol:
 *   RN → WebView: { id, action: 'loadCircuit'|'generateProof', payload }
 *   WebView → RN: { id, ok: true, ...result } | { id, ok: false, error }
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
  const NOIR_JS_URL = 'https://esm.sh/@noir-lang/noir_js@1.0.0-beta.18';
  const BB_JS_URL = 'https://esm.sh/@aztec/bb.js@3.0.0-nightly.20251104';

  let Noir, UltraHonkBackend;
  const circuits = {};

  function send(msg) {
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }

  async function initialize() {
    try {
      const [noirModule, bbModule] = await Promise.all([
        import(NOIR_JS_URL),
        import(BB_JS_URL),
      ]);
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
      return; // ignore non-JSON messages
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
