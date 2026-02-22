import React from 'react';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../shared/theme';
import styles from './Card.module.css';

type CardVariant = 'default' | 'elevated' | 'accent' | 'danger';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: React.CSSProperties;
}

const variantStyles: Record<CardVariant, React.CSSProperties> = {
  default: { backgroundColor: COLORS.surface.card, borderColor: COLORS.surface.cardBorder },
  elevated: { backgroundColor: COLORS.surface.elevated, borderColor: COLORS.surface.cardBorder, ...SHADOWS.md },
  accent: { backgroundColor: COLORS.overlay.goldGlow, borderColor: COLORS.accent.gold },
  danger: { backgroundColor: COLORS.overlay.fireGlow, borderColor: COLORS.accent.fire },
};

export function Card({ children, variant = 'default', style }: CardProps) {
  return (
    <div className={styles.card} style={{ ...variantStyles[variant], ...style }}>
      {children}
    </div>
  );
}
