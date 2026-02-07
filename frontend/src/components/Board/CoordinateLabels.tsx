import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLUMN_LABELS, ROW_LABELS } from '../../constants/game';
import { COLORS, FONTS } from '../../constants/theme';

interface Props {
  cellSize: number;
}

export default function CoordinateLabels({ cellSize }: Props) {
  const labelWidth = 20;

  return (
    <>
      <View style={[styles.columnLabels, { marginLeft: labelWidth }]}>
        {COLUMN_LABELS.map(label => (
          <Text key={label} style={[styles.label, { width: cellSize }]}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.rowLabelsContainer}>
        {ROW_LABELS.map(label => (
          <Text key={label} style={[styles.label, { height: cellSize, lineHeight: cellSize, width: labelWidth }]}>
            {label}
          </Text>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  columnLabels: {
    flexDirection: 'row',
  },
  rowLabelsContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
