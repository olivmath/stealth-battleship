import React from 'react';
import { View, ViewStyle } from 'react-native';
import { COLORS } from '../../shared/theme';

interface Props {
  width?: number;
  color?: string;
  style?: ViewStyle;
}

export default function Divider({ width = 40, color = COLORS.accent.gold, style }: Props) {
  return (
    <View style={[{ width, height: 2, backgroundColor: color, opacity: 0.6 }, style]} />
  );
}
