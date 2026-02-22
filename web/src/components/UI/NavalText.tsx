import React from 'react';
import { COLORS, FONTS, FONT_SIZES } from '../../shared/theme';

type Variant = 'h1' | 'h2' | 'h3' | 'label' | 'body' | 'bodyLight' | 'caption';

interface Props {
  variant: Variant;
  color?: string;
  letterSpacing?: number;
  style?: React.CSSProperties | React.CSSProperties[];
  children: React.ReactNode;
  numberOfLines?: number;
}

const variantConfig: Record<Variant, { tag: string; font: string; size: number; color: string; letterSpacing?: number; weight: number }> = {
  h1: { tag: 'h1', font: FONTS.heading, size: FONT_SIZES.h1, color: COLORS.text.accent, letterSpacing: 4, weight: 700 },
  h2: { tag: 'h2', font: FONTS.heading, size: FONT_SIZES.h2, color: COLORS.text.accent, letterSpacing: 2, weight: 700 },
  h3: { tag: 'h3', font: FONTS.heading, size: FONT_SIZES.h3, color: COLORS.text.accent, letterSpacing: 3, weight: 700 },
  label: { tag: 'span', font: FONTS.heading, size: FONT_SIZES.label, color: COLORS.text.secondary, letterSpacing: 2, weight: 400 },
  body: { tag: 'p', font: FONTS.body, size: FONT_SIZES.body, color: COLORS.text.primary, weight: 600 },
  bodyLight: { tag: 'span', font: FONTS.bodyLight, size: FONT_SIZES.md, color: COLORS.text.secondary, weight: 400 },
  caption: { tag: 'span', font: FONTS.body, size: FONT_SIZES.caption, color: COLORS.text.secondary, letterSpacing: 1, weight: 400 },
};

export function NavalText({ variant, color, letterSpacing, style, children, numberOfLines }: Props) {
  const v = variantConfig[variant];

  const mergedStyle: React.CSSProperties = {
    fontFamily: v.font,
    fontSize: v.size,
    fontWeight: v.weight,
    color: color ?? v.color,
    letterSpacing: letterSpacing ?? v.letterSpacing,
    margin: 0,
    ...(numberOfLines != null
      ? {
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: numberOfLines,
          WebkitBoxOrient: 'vertical' as const,
        }
      : {}),
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  return React.createElement(v.tag, { style: mergedStyle }, children);
}
