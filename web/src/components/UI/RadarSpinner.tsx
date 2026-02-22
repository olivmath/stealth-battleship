import React from 'react';
import { COLORS, FONTS } from '../../shared/theme';
import styles from './RadarSpinner.module.css';

interface Props {
  size?: number;
  label?: string;
}

export function RadarSpinner({ size = 60, label }: Props) {
  const center = size / 2;
  const r = size / 2 - 2;

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
      aria-label="Loading"
      role="progressbar"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer ring */}
        <circle cx={center} cy={center} r={r} fill="none" stroke={COLORS.overlay.goldStrong} strokeWidth={1} />
        {/* Inner ring */}
        <circle cx={center} cy={center} r={r * 0.6} fill="none" stroke={COLORS.overlay.goldStrong} strokeWidth={1} />
        {/* Center dot */}
        <circle cx={center} cy={center} r={3} fill={COLORS.accent.gold} />
        {/* Sweep line */}
        <line
          className={styles.sweep}
          x1={center}
          y1={center}
          x2={center}
          y2={center - r + 2}
          stroke={COLORS.accent.gold}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.8}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />
        {/* Blips */}
        {[0.3, 0.6, 0.8].map((dist, i) => (
          <circle
            key={i}
            className={styles[`blip${i + 1}`]}
            cx={center + Math.cos(Math.PI * (0.3 + i * 0.7)) * r * dist}
            cy={center - Math.sin(Math.PI * (0.3 + i * 0.7)) * r * dist}
            r={2}
            fill={COLORS.accent.gold}
            opacity={0.6}
          />
        ))}
      </svg>
      {label && (
        <span style={{ fontFamily: FONTS.heading, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: COLORS.text.secondary }}>
          {label}
        </span>
      )}
    </div>
  );
}
