import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, RADIUS } from '../../shared/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'pvp' | 'ghost';
  size?: 'default' | 'small' | 'sm';
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function NavalButton({ title, subtitle, onPress, disabled, variant = 'primary', size = 'default', style, accessibilityLabel, accessibilityHint }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
    <AnimatedPressable
      style={[styles.button, isSmall && styles.buttonSmall, { borderColor, backgroundColor: bgColor }, Platform.OS === 'web' && !disabled ? { cursor: 'pointer' } as any : undefined, animatedStyle, style]}
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
        isSmall && styles.textSmall,
        { color: textColor },
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
  subtitle: {
    fontFamily: FONTS.bodyLight,
    fontSize: 9,
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginTop: 2,
    opacity: 0.6,
  },
});
