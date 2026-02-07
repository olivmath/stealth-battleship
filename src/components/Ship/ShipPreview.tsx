import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Orientation } from '../../types/game';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface Props {
  shipName: string;
  orientation: Orientation;
}

export default function ShipPreview({ shipName, orientation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {shipName} • {orientation === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.sm,
    alignItems: 'center',
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.text.accent,
    letterSpacing: 1,
  },
});
