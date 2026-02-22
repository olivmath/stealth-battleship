import React from 'react';
import { motion } from 'framer-motion';
import css from './Ship3D.module.css';

const C = {
  hullDark: '#1a2a3a',
  hullMid: '#243b50',
  hullLight: '#2e4d66',
  hullBottom: '#0f1b28',
  deck: '#2a3f54',
  deckLine: 'rgba(245, 158, 11, 0.12)',
  bridge: '#1e3348',
  bridgeTop: '#243b50',
  bridgeGold: 'rgba(245, 158, 11, 0.25)',
  turret: '#4a5568',
  turretDark: '#2d3748',
  barrel: '#718096',
  mast: '#94a3b8',
  gold: '#f59e0b',
  goldDim: 'rgba(245, 158, 11, 0.4)',
};

function Box({
  w, h, d, colors, x = 0, y = 0, z = 0,
}: {
  w: number; h: number; d: number;
  colors: { top: string; bottom: string; front: string; back: string; left: string; right: string };
  x?: number; y?: number; z?: number;
}) {
  const hw = w / 2, hh = h / 2, hd = d / 2;
  return (
    <div style={{
      position: 'absolute',
      transformStyle: 'preserve-3d' as const,
      transform: `translate3d(${x}px, ${y}px, ${z}px)`,
    }}>
      <div style={{ position: 'absolute', width: w, height: h, background: colors.front, transform: `translateZ(${hd}px) translateX(${-hw}px) translateY(${-hh}px)`, backfaceVisibility: 'hidden' }} />
      <div style={{ position: 'absolute', width: w, height: h, background: colors.back, transform: `translateZ(${-hd}px) rotateY(180deg) translateX(${-hw}px) translateY(${-hh}px)`, backfaceVisibility: 'hidden' }} />
      <div style={{ position: 'absolute', width: w, height: d, background: colors.top, transform: `translateY(${-hh}px) rotateX(90deg) translateX(${-hw}px) translateY(${-hd}px)`, backfaceVisibility: 'hidden' }} />
      <div style={{ position: 'absolute', width: w, height: d, background: colors.bottom, transform: `translateY(${hh}px) rotateX(-90deg) translateX(${-hw}px) translateY(${-hd}px)`, backfaceVisibility: 'hidden' }} />
      <div style={{ position: 'absolute', width: d, height: h, background: colors.left, transform: `translateX(${-hw}px) rotateY(-90deg) translateX(${-hd}px) translateY(${-hh}px)`, backfaceVisibility: 'hidden' }} />
      <div style={{ position: 'absolute', width: d, height: h, background: colors.right, transform: `translateX(${hw}px) rotateY(90deg) translateX(${-hd}px) translateY(${-hh}px)`, backfaceVisibility: 'hidden' }} />
    </div>
  );
}

const hull = { top: C.deck, bottom: C.hullBottom, front: C.hullMid, back: C.hullDark, left: C.hullLight, right: C.hullDark };
const bridge = { top: C.bridgeTop, bottom: C.bridge, front: C.bridge, back: C.bridge, left: C.bridgeTop, right: C.bridge };
const stack = { top: '#4b5563', bottom: '#374151', front: '#374151', back: '#374151', left: '#4b5563', right: '#374151' };

export function Ship3D() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}>
      <div className={css.scene}>
        <div className={css.glow} />
        <div className={css.wake} />
        <div className={css.ocean}>
          <div className={`${css.wave} ${css.wave1}`} />
          <div className={`${css.wave} ${css.wave2}`} />
          <div className={`${css.wave} ${css.wave3}`} />
        </div>
        <div className={css.shipGroup}>
          <Box w={180} h={22} d={44} colors={hull} y={6} />
          <Box w={40} h={18} d={32} colors={{ ...hull, front: C.hullLight, left: C.hullMid }} x={100} y={4} />
          <Box w={24} h={20} d={40} colors={{ ...hull, back: C.hullBottom }} x={-96} y={5} />
          <Box w={170} h={3} d={40} colors={{ top: C.deck, bottom: C.deck, front: C.deckLine, back: C.deckLine, left: C.deckLine, right: C.deckLine }} y={-8} />
          <Box w={160} h={1} d={42} colors={{ top: C.bridgeGold, bottom: 'transparent', front: 'transparent', back: 'transparent', left: 'transparent', right: 'transparent' }} y={-10} />
          <Box w={44} h={20} d={30} colors={bridge} x={-10} y={-22} />
          <Box w={32} h={10} d={24} colors={{ ...bridge, top: C.bridgeGold }} x={-10} y={-35} />
          <Box w={34} h={3} d={31} colors={{ top: 'transparent', bottom: 'transparent', front: C.goldDim, back: C.goldDim, left: C.goldDim, right: C.goldDim }} x={-10} y={-26} />
          <Box w={10} h={16} d={14} colors={stack} x={10} y={-24} />
          <Box w={8} h={12} d={12} colors={stack} x={26} y={-20} />
          <div style={{ position: 'absolute', transformStyle: 'preserve-3d' as const, transform: 'translate3d(50px, -14px, 0px)' }}>
            <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: C.turret, transform: 'rotateX(90deg) translateX(-9px) translateY(-9px)', boxShadow: `0 0 6px ${C.goldDim}` }} />
            <div style={{ position: 'absolute', width: 20, height: 4, borderRadius: 2, background: C.barrel, transform: 'translate3d(6px, -2px, 0px) rotateY(8deg)' }} />
          </div>
          <div style={{ position: 'absolute', transformStyle: 'preserve-3d' as const, transform: 'translate3d(-50px, -14px, 0px)' }}>
            <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: C.turretDark, transform: 'rotateX(90deg) translateX(-8px) translateY(-8px)', boxShadow: `0 0 4px ${C.goldDim}` }} />
            <div style={{ position: 'absolute', width: 16, height: 3, borderRadius: 2, background: C.barrel, transform: 'translate3d(-20px, -1.5px, 0px) rotateY(-8deg)' }} />
          </div>
          <div style={{ position: 'absolute', width: 2, height: 28, borderRadius: 1, background: `linear-gradient(to top, ${C.mast}, ${C.gold})`, transform: 'translate3d(-11px, -62px, 0px)' }} />
          <div style={{ position: 'absolute', width: 16, height: 1, background: C.mast, transform: 'translate3d(-19px, -52px, 0px)' }} />
          <div style={{ position: 'absolute', width: 8, height: 6, borderRadius: '50% 50% 0 0', background: C.goldDim, border: `1px solid ${C.gold}`, borderBottom: 'none', transform: 'translate3d(-15px, -58px, 0px)' }} />
        </div>
      </div>
    </motion.div>
  );
}
