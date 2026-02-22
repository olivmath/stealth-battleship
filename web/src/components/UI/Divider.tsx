import React from 'react';
import { COLORS, SPACING } from '../../shared/theme';

interface DividerProps {
  color?: string;
  spacing?: number;
  width?: number;
  style?: React.CSSProperties;
}

export function Divider({ color = COLORS.surface.cardBorder, spacing = SPACING.md, width, style }: DividerProps) {
  return <div style={{ height: 1, backgroundColor: color, marginTop: spacing, marginBottom: spacing, width: width != null ? width : undefined, ...style }} />;
}
