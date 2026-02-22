import React from 'react';
import { COLORS } from '../../shared/theme';
import styles from './RadarSpinner.module.css';

interface RadarSpinnerProps {
  size?: number;
  label?: string;
}

export function RadarSpinner({ size = 100, label }: RadarSpinnerProps) {
  const center = size / 2;
  const r = size / 2 - 4;

  return (
    <div className={styles.wrapper}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Rings */}
        {[0.33, 0.66, 1].map((scale, i) => (
          <circle key={i} cx={center} cy={center} r={r * scale}
            fill="none" stroke={COLORS.grid.border} strokeWidth={1} opacity={0.3} />
        ))}
        {/* Cross */}
        <line x1={center} y1={4} x2={center} y2={size - 4} stroke={COLORS.grid.border} strokeWidth={0.5} opacity={0.2} />
        <line x1={4} y1={center} x2={size - 4} y2={center} stroke={COLORS.grid.border} strokeWidth={0.5} opacity={0.2} />
        {/* Sweep */}
        <line className={styles.sweep} x1={center} y1={center} x2={center} y2={4}
          stroke={COLORS.accent.gold} strokeWidth={2} strokeLinecap="round"
          style={{ transformOrigin: `${center}px ${center}px` }} />
        {/* Blips */}
        <circle className={styles.blip1} cx={center + r * 0.4} cy={center - r * 0.3} r={2.5} fill={COLORS.accent.gold} />
        <circle className={styles.blip2} cx={center - r * 0.5} cy={center + r * 0.2} r={2} fill={COLORS.accent.gold} />
      </svg>
      {label && <span className={styles.label} style={{ color: COLORS.text.secondary, fontFamily: "'Orbitron', sans-serif" }}>{label}</span>}
    </div>
  );
}
