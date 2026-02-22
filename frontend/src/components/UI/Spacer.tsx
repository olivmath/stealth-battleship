import React from 'react';
import { View } from 'react-native';
import { SPACING } from '../../shared/theme';

interface Props {
  size: keyof typeof SPACING;
  horizontal?: boolean;
}

export default function Spacer({ size, horizontal = false }: Props) {
  const value = SPACING[size];
  return <View style={horizontal ? { width: value } : { height: value }} />;
}
