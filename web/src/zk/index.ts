export { initZK, boardValidity, shotProof, turnsProof, destroyZK } from './interactor';
export { ServerZKProvider } from './adapter';
export { WebWasmZKProvider } from './webWasmProvider';
export { toShipTuples, toAttackTuples } from './entities';
export type {
  ShipTuples,
  AttackTuple,
  ZKProvider,
  BoardValidityInput,
  BoardValidityResult,
  ShotProofInput,
  ShotProofResult,
  TurnsProofInput,
  TurnsProofResult,
} from './entities';
