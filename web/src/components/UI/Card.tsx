import React from 'react';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../shared/theme';

type Variant = 'default' | 'elevated' | 'accent' | 'danger';

interface Props {
  variant?: Variant;
  style?: React.CSSProperties | React.CSSProperties[];
  children: React.ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  default: {},
  elevated: {
    backgroundColor: COLORS.surface.elevated,
    ...SHADOWS.md,
  },
  accent: {
    borderColor: COLORS.accent.gold,
    backgroundColor: COLORS.overlay.goldGlow,
  },
  danger: {
    borderColor: COLORS.accent.fire,
    backgroundColor: COLORS.overlay.fireGlow,
  },
};

export function Card({ variant = 'default', style, children }: Props) {
  const merged: React.CSSProperties = {
    padding: SPACING.md,
    borderRadius: RADIUS.default,
    border: `1px solid ${COLORS.grid.border}`,
    backgroundColor: COLORS.surface.card,
    ...SHADOWS.sm,
    ...variantStyles[variant],
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  return <div style={merged}>{children}</div>;
}
