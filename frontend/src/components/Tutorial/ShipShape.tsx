import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

export function ShipShape({ length, label }: { length: number; label: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.cells}>
        {Array.from({ length }).map((_, i) => (
          <View key={i} style={[
            styles.cell,
            i === 0 && styles.cellFirst,
            i === length - 1 && styles.cellLast,
          ]} />
        ))}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cells: {
    flexDirection: 'row',
    gap: 2,
  },
  cell: {
    width: 22,
    height: 22,
    backgroundColor: COLORS.grid.ship,
    borderWidth: 1,
    borderColor: COLORS.grid.shipLight,
  },
  cellFirst: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  cellLast: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text.secondary,
  },
});
