import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../shared/theme';

type Variant = 'default' | 'elevated' | 'accent' | 'danger';

interface Props {
  variant?: Variant;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

export default function Card({ variant = 'default', style, children }: Props) {
  return (
    <View style={[styles.base, variantStyles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: SPACING.md,
    borderRadius: RADIUS.default,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    backgroundColor: COLORS.surface.card,
    ...SHADOWS.sm,
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
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
