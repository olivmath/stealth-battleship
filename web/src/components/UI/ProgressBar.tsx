import React from 'react';
import { COLORS, SPACING, RADIUS } from '../../shared/theme';

interface Props {
  /** Progress from 0 to 1 */
  progress: number;
  /** Fill color (defaults to gold) */
  color?: string;
  /** Height in px */
  height?: number;
  /** Left label */
  labelLeft?: string;
  /** Right label */
  labelRight?: string;
}

export function ProgressBar({
  progress,
  color = COLORS.accent.gold,
  height = 6,
  labelLeft,
  labelRight,
}: Props) {
  const pct = `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`;

  return (
    <div>
      <div
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: COLORS.surface.elevated,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: pct,
            borderRadius: height / 2,
            backgroundColor: color,
            transition: 'width 0.4s ease-out',
          }}
        />
      </div>
      {(labelLeft || labelRight) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 2,
          }}
        >
          <span style={labelStyle}>{labelLeft ?? ''}</span>
          <span style={labelStyle}>{labelRight ?? ''}</span>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: 10,
  color: COLORS.text.secondary,
  opacity: 0.6,
};
