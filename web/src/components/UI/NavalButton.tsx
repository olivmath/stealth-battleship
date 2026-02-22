import React from 'react';
import { motion } from 'framer-motion';
import { COLORS, FONTS, SPACING, RADIUS } from '../../shared/theme';
import styles from './NavalButton.module.css';

interface Props {
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'pvp' | 'ghost';
  size?: 'default' | 'small' | 'sm';
  style?: React.CSSProperties;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function NavalButton({
  title,
  subtitle,
  onPress,
  disabled,
  variant = 'primary',
  size = 'default',
  style,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const variantMap: Record<string, { border: string; bg: string; text: string }> = {
    primary: { border: COLORS.ui.buttonBorder, bg: COLORS.ui.buttonBg, text: COLORS.text.accent },
    secondary: { border: COLORS.surface.cardBorder, bg: 'transparent', text: COLORS.text.primary },
    danger: { border: COLORS.accent.fire, bg: COLORS.ui.buttonBg, text: COLORS.accent.fire },
    success: { border: COLORS.status.online, bg: COLORS.ui.buttonBg, text: COLORS.status.online },
    pvp: { border: COLORS.status.pvp, bg: COLORS.ui.buttonBg, text: COLORS.status.pvp },
    ghost: { border: 'transparent', bg: 'transparent', text: COLORS.text.primary },
  };

  const v = variantMap[variant] ?? variantMap.primary;
  const borderColor = disabled ? COLORS.ui.disabledBorder : v.border;
  const bgColor = disabled ? COLORS.ui.disabledBg : v.bg;
  const textColor = disabled ? COLORS.text.secondary : v.text;

  const isSmall = size === 'small' || size === 'sm';

  return (
    <motion.button
      className={styles.button}
      onClick={disabled ? undefined : onPress}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      role="button"
      aria-label={accessibilityLabel ?? title}
      aria-disabled={disabled || undefined}
      title={accessibilityHint}
      style={{
        paddingTop: isSmall ? SPACING.sm : SPACING.sm + 4,
        paddingBottom: isSmall ? SPACING.sm : SPACING.sm + 4,
        paddingLeft: isSmall ? SPACING.md : SPACING.lg,
        paddingRight: isSmall ? SPACING.md : SPACING.lg,
        borderRadius: RADIUS.default,
        borderWidth: 1.5,
        borderStyle: 'solid',
        borderColor,
        backgroundColor: bgColor,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: FONTS.heading,
          fontSize: isSmall ? 11 : 14,
          color: textColor,
          textTransform: 'uppercase',
          letterSpacing: isSmall ? 1 : 2,
        }}
      >
        {title}
      </span>
      {subtitle && (
        <span
          style={{
            fontFamily: FONTS.bodyLight,
            fontSize: 9,
            color: COLORS.text.secondary,
            letterSpacing: 1,
            marginTop: 2,
            opacity: 0.6,
            display: 'block',
          }}
        >
          {subtitle}
        </span>
      )}
    </motion.button>
  );
}
