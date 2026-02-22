export { initZK, boardValidity, shotProof, turnsProof, destroyZK } from './interactor';
export { ZKWebView, webViewZKProvider, ServerZKProvider } from './adapter';
export type {
  ZKProvider,
  ShipTuple,
  BoardValidityInput,
  BoardValidityResult,
  ShotProofInput,
  ShotProofResult,
  TurnsProofInput,
  TurnsProofResult,
  OnProgressCallback,
} from './entities';
