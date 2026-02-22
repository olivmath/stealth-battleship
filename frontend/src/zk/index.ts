export { initZK, boardValidity, shotProof, turnsProof, destroyZK } from './interactor';
export { ZKWebView, webViewZKProvider, ServerZKProvider } from './adapter';
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
