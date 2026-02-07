import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}

export default function NavalButton({ title, onPress, disabled, variant = 'primary', style }: Props) {
  const borderColor = disabled
    ? COLORS.ui.disabledBorder
    : variant === 'danger'
      ? COLORS.accent.fire
      : COLORS.ui.buttonBorder;

  const bgColor = disabled ? COLORS.ui.disabledBg : COLORS.ui.buttonBg;

  return (
    <TouchableOpacity
      style={[styles.button, { borderColor, backgroundColor: bgColor }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.text,
        disabled && styles.disabledText,
        variant === 'danger' && styles.dangerText,
      ]}>
        {title}
      </Text>
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
  text: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.text.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  disabledText: {
    color: COLORS.text.secondary,
  },
  dangerText: {
    color: COLORS.accent.fire,
  },
});
