export { initZK, boardValidity, shotProof, turnsProof, destroyZK } from './zkService';
export { ZKWebView, webViewZKProvider } from './webview/WebViewZKProvider';
export { ServerZKProvider } from './server/ServerZKProvider';
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
} from './types';
