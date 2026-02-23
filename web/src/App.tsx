import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './game/translator';
import { PvPProvider } from './pvp/translator';
import { RadarSpinner } from './components/UI/RadarSpinner';
import { initZK, ServerZKProvider, WebWasmZKProvider } from './zk';
import './i18n';

const ZK_MODE = import.meta.env.VITE_ZK_MODE || 'local';
const ZK_SERVER_URL = import.meta.env.VITE_ZK_SERVER_URL || 'http://localhost:3001';

// Lazy load all pages
const Splash = lazy(() => import('./pages/Splash'));
const Login = lazy(() => import('./pages/Login'));
const Menu = lazy(() => import('./pages/Menu'));
const Placement = lazy(() => import('./pages/Placement'));
const Battle = lazy(() => import('./pages/Battle'));
const GameOver = lazy(() => import('./pages/GameOver'));
const Tutorial = lazy(() => import('./pages/Tutorial'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const MatchHistory = lazy(() => import('./pages/MatchHistory'));
const MatchDetail = lazy(() => import('./pages/MatchDetail'));
const Wallet = lazy(() => import('./pages/Wallet'));
const WalletSetup = lazy(() => import('./pages/WalletSetup'));
const PvpMode = lazy(() => import('./pages/PvpMode'));
const PvpFriend = lazy(() => import('./pages/PvpFriend'));
const PvpLobby = lazy(() => import('./pages/PvpLobby'));

const fallbackStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  background: '#0a0e1a',
};

export default function App() {
  const [fontsReady, setFontsReady] = useState(false);
  const [zkReady, setZkReady] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    const provider = ZK_MODE === 'server'
      ? new ServerZKProvider(ZK_SERVER_URL)
      : new WebWasmZKProvider();

    console.log(`[ZK] Initializing ZK provider (mode=${ZK_MODE})...`);
    initZK(provider).then(() => {
      console.log('[ZK] Provider ready');
      setZkReady(true);
    }).catch((err) => {
      console.error('[ZK] Provider init failed:', err);
      setZkReady(true); // proceed anyway, proofs will fail gracefully
    });
  }, []);

  if (!fontsReady || !zkReady) {
    return (
      <div style={fallbackStyle}>
        <RadarSpinner size={80} label={!zkReady ? "LOADING ZK..." : "LOADING"} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <GameProvider>
        <PvPProvider>
        <Suspense fallback={<div style={fallbackStyle}><RadarSpinner size={80} /></div>}>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/placement" element={<Placement />} />
            <Route path="/battle" element={<Battle />} />
            <Route path="/gameover" element={<GameOver />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/match-history" element={<MatchHistory />} />
            <Route path="/match-detail" element={<MatchDetail />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/wallet-setup" element={<WalletSetup />} />
            <Route path="/pvp-mode" element={<PvpMode />} />
            <Route path="/pvp-friend" element={<PvpFriend />} />
            <Route path="/pvp-lobby" element={<PvpLobby />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </PvPProvider>
      </GameProvider>
    </BrowserRouter>
  );
}
