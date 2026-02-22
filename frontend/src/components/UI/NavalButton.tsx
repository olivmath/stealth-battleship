import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, RADIUS } from '../../shared/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderColor = disabled
    ? COLORS.ui.disabledBorder
    : variant === 'danger'
      ? COLORS.accent.fire
      : variant === 'success'
        ? COLORS.status.online
        : variant === 'pvp'
          ? COLORS.status.pvp
          : COLORS.ui.buttonBorder;

  const bgColor = disabled ? COLORS.ui.disabledBg : COLORS.ui.buttonBg;

  return (
    <AnimatedPressable
      style={[styles.button, size === 'small' && styles.buttonSmall, { borderColor, backgroundColor: bgColor }, animatedStyle, style]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      disabled={disabled}
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
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.default,
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
    color: COLORS.status.online,
  },
  pvpText: {
    color: COLORS.status.pvp,
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
