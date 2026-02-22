import React from 'react';
import { COLORS } from '../../shared/theme';

interface Props {
  width?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function Divider({ width = 40, color = COLORS.accent.gold, style }: Props) {
  return (
    <div
      style={{
        width,
        height: 2,
        backgroundColor: color,
        opacity: 0.6,
        ...style,
      }}
    />
  );
}
