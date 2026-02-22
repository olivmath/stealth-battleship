import React from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '../../shared/theme';
import styles from './NavalButton.module.css';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'pvp' | 'success';

interface NavalButtonProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  size?: 'sm' | 'small' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

const sizeMap = {
  sm: { paddingV: 8, paddingH: 16, fontSize: FONT_SIZES.sm },
  md: { paddingV: 12, paddingH: 24, fontSize: FONT_SIZES.body },
  lg: { paddingV: 16, paddingH: 32, fontSize: FONT_SIZES.lg },
};

export function NavalButton({ title, subtitle, onPress, variant = 'primary', disabled, size = 'md', fullWidth, icon, style }: NavalButtonProps) {
  const resolvedSize = size === 'small' ? 'sm' : size;
  const s = sizeMap[resolvedSize];

  const variantStyles: Record<Variant, { bg: string; border: string; text: string }> = {
    primary: { bg: COLORS.ui.buttonBg, border: COLORS.ui.buttonBorder, text: COLORS.accent.gold },
    secondary: { bg: 'transparent', border: COLORS.surface.cardBorder, text: COLORS.text.primary },
    danger: { bg: COLORS.overlay.fireGlow, border: COLORS.accent.fire, text: COLORS.accent.fire },
    ghost: { bg: 'transparent', border: 'transparent', text: COLORS.text.primary },
    pvp: { bg: COLORS.overlay.goldGlow, border: COLORS.status.pvp, text: COLORS.status.pvp },
    success: { bg: COLORS.overlay.victoryGlow, border: COLORS.accent.victory, text: COLORS.accent.victory },
  };

  const vs = variantStyles[variant];
  const bgColor = disabled ? COLORS.ui.disabledBg : vs.bg;
  const borderColor = disabled ? COLORS.ui.disabledBorder : vs.border;
  const textColor = disabled ? COLORS.text.secondary : vs.text;

  return (
    <motion.button
      className={styles.button}
      onClick={disabled ? undefined : onPress}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      style={{
        padding: `${s.paddingV}px ${s.paddingH}px`,
        backgroundColor: bgColor,
        borderColor,
        color: textColor,
        fontFamily: FONTS.heading,
        fontSize: s.fontSize,
        fontWeight: 700,
        width: fullWidth ? '100%' : undefined,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: 2,
        textTransform: 'uppercase',
        ...style,
      }}
      disabled={disabled}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span>{title}</span>
      {subtitle && <span style={{ fontSize: s.fontSize - 2, opacity: 0.7, fontWeight: 400, display: 'block' }}>{subtitle}</span>}
    </motion.button>
  );
}
