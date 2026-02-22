import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { COLORS, FONTS, FONT_SIZES } from '../../shared/theme';

type Variant = 'h1' | 'h2' | 'h3' | 'label' | 'body' | 'bodyLight' | 'caption';

interface Props {
  variant: Variant;
  color?: string;
  letterSpacing?: number;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
  numberOfLines?: number;
}

const variantStyles: Record<Variant, TextStyle> = {
  h1: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.h1,
    color: COLORS.text.accent,
    letterSpacing: 4,
  },
  h2: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.h2,
    color: COLORS.text.accent,
    letterSpacing: 2,
  },
  h3: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.h3,
    color: COLORS.text.accent,
    letterSpacing: 3,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.label,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.body,
    color: COLORS.text.primary,
  },
  bodyLight: {
    fontFamily: FONTS.bodyLight,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  caption: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
};

export default function NavalText({ variant, color, letterSpacing, style, children, numberOfLines }: Props) {
  const base = variantStyles[variant];

  return (
    <Text
      style={[base, color != null && { color }, letterSpacing != null && { letterSpacing }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}
