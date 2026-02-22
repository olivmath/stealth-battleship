import React from 'react';
import { SPACING } from '../../shared/theme';

type SpacingKey = keyof typeof SPACING;

interface SpacerProps {
  size?: number | SpacingKey;
  horizontal?: boolean;
}

export function Spacer({ size = 16, horizontal }: SpacerProps) {
  const px = typeof size === 'string' ? SPACING[size] : size;
  return <div style={horizontal ? { width: px } : { height: px }} />;
}
