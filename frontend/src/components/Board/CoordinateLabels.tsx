import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLUMN_LABELS, ROW_LABELS, getColumnLabels, getRowLabels } from '../../constants/game';
import { COLORS, FONTS } from '../../constants/theme';

interface Props {
  cellSize: number;
  gridSize?: number;
}

export default function CoordinateLabels({ cellSize, gridSize }: Props) {
  const labelWidth = 20;
  const colLabels = gridSize ? getColumnLabels(gridSize as 6 | 10) : COLUMN_LABELS;
  const rowLabels = gridSize ? getRowLabels(gridSize as 6 | 10) : ROW_LABELS;

  return (
    <>
      <View style={[styles.columnLabels, { marginLeft: labelWidth }]}>
        {colLabels.map(label => (
          <Text key={label} style={[styles.label, { width: cellSize }]}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.rowLabelsContainer}>
        {rowLabels.map(label => (
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
