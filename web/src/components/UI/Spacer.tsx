import React from 'react';
import { SPACING } from '../../shared/theme';

interface Props {
  size: keyof typeof SPACING;
  horizontal?: boolean;
}

export function Spacer({ size, horizontal = false }: Props) {
  const value = SPACING[size];
  return <div style={horizontal ? { width: value } : { height: value }} />;
}
