import React from 'react';
import { COLORS, FONTS, FONT_SIZES } from '../../shared/theme';

type Variant = 'h1' | 'h2' | 'h3' | 'label' | 'body' | 'bodyLight' | 'caption';

interface NavalTextProps {
  children: React.ReactNode;
  variant?: Variant;
  color?: string;
  style?: React.CSSProperties;
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;
}

const variantMap: Record<Variant, { tag: string; font: string; size: number; weight: number }> = {
  h1: { tag: 'h1', font: FONTS.heading, size: FONT_SIZES.h1, weight: 700 },
  h2: { tag: 'h2', font: FONTS.heading, size: FONT_SIZES.h2, weight: 700 },
  h3: { tag: 'h3', font: FONTS.heading, size: FONT_SIZES.h3, weight: 700 },
  label: { tag: 'span', font: FONTS.heading, size: FONT_SIZES.label, weight: 400 },
  body: { tag: 'span', font: FONTS.body, size: FONT_SIZES.body, weight: 600 },
  bodyLight: { tag: 'span', font: FONTS.bodyLight, size: FONT_SIZES.body, weight: 400 },
  caption: { tag: 'span', font: FONTS.body, size: FONT_SIZES.caption, weight: 400 },
};

export function NavalText({ children, variant = 'body', color = COLORS.text.primary, style, align, letterSpacing }: NavalTextProps) {
  const v = variantMap[variant];
  const Tag = v.tag as any;
  return (
    <Tag style={{
      fontFamily: v.font,
      fontSize: v.size,
      fontWeight: v.weight,
      color,
      textAlign: align,
      letterSpacing: letterSpacing != null ? letterSpacing : undefined,
      margin: 0,
      ...style,
    }}>
      {children}
    </Tag>
  );
}
