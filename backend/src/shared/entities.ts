// Entity layer — pure types + validation (zero external deps)

export type ShipTuple = [number, number, number, boolean];
export type AttackTuple = [number, number];

// ─── Board Validity ───

export interface BoardValidityInput {
  ships: [ShipTuple, ShipTuple, ShipTuple];
  nonce: string;
}

export interface BoardValidityResult {
  proof: number[];
  boardHash: string;
}

// ─── Shot Proof ───

export interface ShotProofInput {
  ships: [ShipTuple, ShipTuple, ShipTuple];
  nonce: string;
  boardHash: string;
  row: number;
  col: number;
  isHit: boolean;
}

export interface ShotProofResult {
  proof: number[];
}

// ─── Turns Proof ───

export interface TurnsProofInput {
  shipsPlayer: [ShipTuple, ShipTuple, ShipTuple];
  shipsAi: [ShipTuple, ShipTuple, ShipTuple];
  noncePlayer: string;
  nonceAi: string;
  boardHashPlayer: string;
  boardHashAi: string;
  attacksPlayer: AttackTuple[];
  attacksAi: AttackTuple[];
  nAttacksPlayer: number;
  nAttacksAi: number;
  shipSizes: [number, number, number];
  winner: number;
}

export interface TurnsProofResult {
  proof: number[];
}

// ─── Validation ───

type ValidationOk<T> = { ok: true; data: T };
type ValidationErr = { ok: false; error: string };
type ValidationResult<T> = ValidationOk<T> | ValidationErr;

function validateShipsArray(ships: unknown): ships is [ShipTuple, ShipTuple, ShipTuple] {
  if (!ships || !Array.isArray(ships) || ships.length !== 3) return false;
  for (let i = 0; i < 3; i++) {
    const s = ships[i];
    if (!Array.isArray(s) || s.length !== 4) return false;
  }
  return true;
}

export function validateBoardValidityInput(body: unknown): ValidationResult<BoardValidityInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const { ships, nonce } = body as Record<string, unknown>;

  if (!validateShipsArray(ships)) {
    return { ok: false, error: 'Invalid input: ships must be array of 3 tuples [row, col, size, horizontal]' };
  }

  if (!nonce || typeof nonce !== 'string') {
    return { ok: false, error: 'Invalid input: nonce must be a non-empty string' };
  }

  return { ok: true, data: { ships, nonce } };
}

export function validateShotProofInput(body: unknown): ValidationResult<ShotProofInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const { ships, nonce, boardHash, row, col, isHit } = body as Record<string, unknown>;

  if (!validateShipsArray(ships)) {
    return { ok: false, error: 'Invalid input: ships must be array of 3 tuples' };
  }
  if (!nonce || typeof nonce !== 'string') {
    return { ok: false, error: 'Invalid input: nonce must be a non-empty string' };
  }
  if (!boardHash || typeof boardHash !== 'string') {
    return { ok: false, error: 'Invalid input: boardHash must be a non-empty string' };
  }
  if (typeof row !== 'number' || row < 0 || row > 5) {
    return { ok: false, error: 'Invalid input: row must be 0-5' };
  }
  if (typeof col !== 'number' || col < 0 || col > 5) {
    return { ok: false, error: 'Invalid input: col must be 0-5' };
  }
  if (typeof isHit !== 'boolean') {
    return { ok: false, error: 'Invalid input: isHit must be a boolean' };
  }

  return { ok: true, data: { ships, nonce, boardHash, row, col, isHit } };
}

export function validateTurnsProofInput(body: unknown): ValidationResult<TurnsProofInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const b = body as Record<string, unknown>;

  if (!validateShipsArray(b.shipsPlayer)) {
    return { ok: false, error: 'Invalid input: shipsPlayer must be array of 3 tuples' };
  }
  if (!validateShipsArray(b.shipsAi)) {
    return { ok: false, error: 'Invalid input: shipsAi must be array of 3 tuples' };
  }
  if (!b.noncePlayer || typeof b.noncePlayer !== 'string') {
    return { ok: false, error: 'Invalid input: noncePlayer must be a non-empty string' };
  }
  if (!b.nonceAi || typeof b.nonceAi !== 'string') {
    return { ok: false, error: 'Invalid input: nonceAi must be a non-empty string' };
  }
  if (!b.boardHashPlayer || typeof b.boardHashPlayer !== 'string') {
    return { ok: false, error: 'Invalid input: boardHashPlayer must be a non-empty string' };
  }
  if (!b.boardHashAi || typeof b.boardHashAi !== 'string') {
    return { ok: false, error: 'Invalid input: boardHashAi must be a non-empty string' };
  }
  if (!Array.isArray(b.attacksPlayer)) {
    return { ok: false, error: 'Invalid input: attacksPlayer must be an array of [row, col] tuples' };
  }
  if (!Array.isArray(b.attacksAi)) {
    return { ok: false, error: 'Invalid input: attacksAi must be an array of [row, col] tuples' };
  }
  if (typeof b.nAttacksPlayer !== 'number') {
    return { ok: false, error: 'Invalid input: nAttacksPlayer must be a number' };
  }
  if (typeof b.nAttacksAi !== 'number') {
    return { ok: false, error: 'Invalid input: nAttacksAi must be a number' };
  }
  if (!Array.isArray(b.shipSizes) || b.shipSizes.length !== 3) {
    return { ok: false, error: 'Invalid input: shipSizes must be array of 3 numbers' };
  }
  if (typeof b.winner !== 'number' || (b.winner !== 0 && b.winner !== 1)) {
    return { ok: false, error: 'Invalid input: winner must be 0 or 1' };
  }

  return {
    ok: true,
    data: {
      shipsPlayer: b.shipsPlayer as [ShipTuple, ShipTuple, ShipTuple],
      shipsAi: b.shipsAi as [ShipTuple, ShipTuple, ShipTuple],
      noncePlayer: b.noncePlayer as string,
      nonceAi: b.nonceAi as string,
      boardHashPlayer: b.boardHashPlayer as string,
      boardHashAi: b.boardHashAi as string,
      attacksPlayer: b.attacksPlayer as AttackTuple[],
      attacksAi: b.attacksAi as AttackTuple[],
      nAttacksPlayer: b.nAttacksPlayer as number,
      nAttacksAi: b.nAttacksAi as number,
      shipSizes: b.shipSizes as [number, number, number],
      winner: b.winner as number,
    },
  };
}
