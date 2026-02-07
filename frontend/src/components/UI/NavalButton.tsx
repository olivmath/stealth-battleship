import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'pvp';
  size?: 'default' | 'small';
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function NavalButton({ title, subtitle, onPress, disabled, variant = 'primary', size = 'default', style, accessibilityLabel, accessibilityHint }: Props) {
  const borderColor = disabled
    ? COLORS.ui.disabledBorder
    : variant === 'danger'
      ? COLORS.accent.fire
      : variant === 'success'
        ? '#22c55e'
        : variant === 'pvp'
          ? '#22d3ee'
          : COLORS.ui.buttonBorder;

  const bgColor = disabled ? COLORS.ui.disabledBg : COLORS.ui.buttonBg;

  return (
    <TouchableOpacity
      style={[styles.button, size === 'small' && styles.buttonSmall, { borderColor, backgroundColor: bgColor }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={[
        styles.text,
        size === 'small' && styles.textSmall,
        disabled && styles.disabledText,
        variant === 'danger' && styles.dangerText,
        variant === 'success' && styles.successText,
        variant === 'pvp' && styles.pvpText,
      ]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  text: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.text.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  textSmall: {
    fontSize: 11,
    letterSpacing: 1,
  },
  disabledText: {
    color: COLORS.text.secondary,
  },
  dangerText: {
    color: COLORS.accent.fire,
  },
  successText: {
    color: '#22c55e',
  },
  pvpText: {
    color: '#22d3ee',
  },
  subtitle: {
    fontFamily: FONTS.bodyLight,
    fontSize: 9,
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginTop: 2,
    opacity: 0.6,
  },
});
