// Entity layer — pure types + validation (zero external deps)

export type ShipTuple = [number, number, number, boolean];

export interface BoardValidityInput {
  ships: [ShipTuple, ShipTuple, ShipTuple];
  nonce: string;
}

export interface BoardValidityResult {
  proof: number[];
  boardHash: string;
}

export interface ShotProofInput {
  // TODO: define fields
}

export interface ShotProofResult {
  // TODO: define fields
}

export interface TurnsProofInput {
  // TODO: define fields
}

export interface TurnsProofResult {
  // TODO: define fields
}

type ValidationOk<T> = { ok: true; data: T };
type ValidationErr = { ok: false; error: string };
type ValidationResult<T> = ValidationOk<T> | ValidationErr;

export function validateBoardValidityInput(body: unknown): ValidationResult<BoardValidityInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const { ships, nonce } = body as Record<string, unknown>;

  if (!ships || !Array.isArray(ships) || ships.length !== 3) {
    return { ok: false, error: 'Invalid input: ships must be array of 3 tuples' };
  }

  for (let i = 0; i < 3; i++) {
    const s = ships[i];
    if (!Array.isArray(s) || s.length !== 4) {
      return { ok: false, error: `Invalid ship[${i}]: expected [row, col, size, horizontal]` };
    }
  }

  if (!nonce || typeof nonce !== 'string') {
    return { ok: false, error: 'Invalid input: nonce must be a non-empty string' };
  }

  return {
    ok: true,
    data: { ships: ships as [ShipTuple, ShipTuple, ShipTuple], nonce },
  };
}
