import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Noir } from "npm:@noir-lang/noir_js@1.0.0-beta.18";
import { UltraHonkBackend } from "npm:@aztec/bb.js@0.82.2";

// ─── Config ───
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/circuits`;

// ─── Types ───
type ShipTuple = [number, number, number, boolean];

interface BoardValidityVerifyInput {
  ships: ShipTuple[];
  nonce: string;
  proof: number[];
}

// ─── Validation ───
const NUM_SHIPS = 5;

function validateInput(
  body: unknown
): { ok: true; data: BoardValidityVerifyInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const { ships, nonce, proof } = body as Record<string, unknown>;

  if (!ships || !Array.isArray(ships) || ships.length !== NUM_SHIPS) {
    return {
      ok: false,
      error: `ships must be array of ${NUM_SHIPS} tuples [row, col, size, horizontal]`,
    };
  }
  for (const s of ships) {
    if (!Array.isArray(s) || s.length !== 4) {
      return { ok: false, error: "Each ship must be a tuple of 4 elements" };
    }
  }

  if (!nonce || typeof nonce !== "string") {
    return { ok: false, error: "nonce must be a non-empty string" };
  }

  if (!Array.isArray(proof) || proof.length === 0) {
    return {
      ok: false,
      error: "proof must be a non-empty array of numbers",
    };
  }

  return { ok: true, data: { ships: ships as ShipTuple[], nonce, proof: proof as number[] } };
}

// ─── Circuit helpers ───
function toNoirShips(ships: ShipTuple[]) {
  return ships.map(([r, c, s, h]) => [String(r), String(c), String(s), h]);
}

// Lazy-initialized circuit instances (cached across warm invocations)
let hashNoir: Noir | null = null;
let boardBackend: UltraHonkBackend | null = null;

async function getHashNoir(): Promise<Noir> {
  if (!hashNoir) {
    console.log("[init] Fetching hash_helper circuit from Storage...");
    const t = Date.now();
    const res = await fetch(`${STORAGE_BASE}/hash_helper.json`);
    if (!res.ok) throw new Error(`Failed to fetch hash_helper: ${res.status}`);
    const circuit = await res.json();
    hashNoir = new Noir(circuit);
    console.log(`[init] hash_helper loaded (${Date.now() - t}ms)`);
  }
  return hashNoir;
}

async function getBoardBackend(): Promise<UltraHonkBackend> {
  if (!boardBackend) {
    console.log("[init] Fetching board_validity circuit from Storage...");
    const t = Date.now();
    const res = await fetch(`${STORAGE_BASE}/board_validity.json`);
    if (!res.ok) throw new Error(`Failed to fetch board_validity: ${res.status}`);
    const circuit = await res.json();
    boardBackend = new UltraHonkBackend(circuit.bytecode);
    console.log(`[init] board_validity loaded (${Date.now() - t}ms)`);
  }
  return boardBackend;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

// ─── Handler ───
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const t0 = Date.now();

  try {
    const body = await req.json();
    const validation = validateInput(body);

    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: 400, headers: CORS_HEADERS });
    }

    const { ships, nonce, proof } = validation.data;

    console.log(`[verify] Ships: ${JSON.stringify(ships)}`);
    console.log(`[verify] Nonce: ${nonce}`);
    console.log(`[verify] Proof size: ${proof.length} bytes`);

    // Step 1: Compute board hash (Poseidon2) via hash_helper circuit
    console.log("[verify] Step 1/2: Computing board hash (Poseidon2)...");
    const t1 = Date.now();
    const noirShips = toNoirShips(ships);
    const noir = await getHashNoir();
    const hashResult = await noir.execute({ ships: noirShips, nonce });
    const boardHash = hashResult.returnValue as string;
    console.log(`[verify] Board hash: ${boardHash} (${Date.now() - t1}ms)`);

    // Step 2: Verify proof with public inputs
    const shipSizes = ships.map(([, , s]) => String(s));
    const publicInputs = [boardHash, ...shipSizes];

    console.log("[verify] Step 2/2: Verifying board_validity proof...");
    console.log(`[verify] Public inputs: ${JSON.stringify(publicInputs)}`);
    const t2 = Date.now();
    const backend = await getBoardBackend();
    const valid = await backend.verifyProof({
      proof: new Uint8Array(proof),
      publicInputs,
    });
    console.log(`[verify] Verification: ${valid} (${Date.now() - t2}ms)`);

    const totalMs = Date.now() - t0;
    console.log(`[verify] RESULT: valid=${valid} total=${totalMs}ms`);

    return Response.json({ valid }, { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err: any) {
    const totalMs = Date.now() - t0;
    console.error(`[verify] ERROR (${totalMs}ms): ${err.message}`);
    console.error(err.stack);

    return Response.json(
      { error: "Proof verification failed", details: err.message },
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
