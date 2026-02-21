export { initZK, boardValidity, shotProof, turnsProof, destroyZK } from './zkService';
export { ZKWebView, webViewZKProvider } from './webview/WebViewZKProvider';
export type {
  ZKProvider,
  ShipTuple,
  BoardValidityInput,
  BoardValidityResult,
  ShotProofInput,
  ShotProofResult,
  TurnsProofInput,
  TurnsProofResult,
} from './types';
