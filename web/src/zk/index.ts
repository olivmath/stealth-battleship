export { initZK, boardValidity, shotProof, turnsProof, destroyZK } from './interactor';
export { WebWasmZKProvider } from './webWasmProvider';
export { toShipTuples, toAttackTuples } from './entities';
export type {
  ZKProvider,
  ShipTuple,
  ShipTuples,
  AttackTuple,
  BoardValidityInput,
  BoardValidityResult,
  ShotProofInput,
  ShotProofResult,
  TurnsProofInput,
  TurnsProofResult,
  OnProgressCallback,
} from './entities';
