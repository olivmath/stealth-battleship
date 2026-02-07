import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Cell from './Cell';
import { Board, Position, GridSizeOption } from '../../types/game';
import { getColumnLabels, getRowLabels, getShipStyle } from '../../constants/game';
import { COLORS, FONTS } from '../../constants/theme';

type Variant = 'full' | 'mini';

interface Props {
  board: Board;
  onCellPress?: (position: Position) => void;
  disabled?: boolean;
  showShips?: boolean;
  previewPositions?: Position[];
  gridSize?: number;
  isOpponent?: boolean;
  maxWidth: number;
  variant: Variant;
  colLabelsBottom?: boolean;
}

const LABEL_SIZES: Record<Variant, number> = {
  full: 24,
  mini: 14,
};

const FONT_SIZES: Record<Variant, number> = {
  full: 11,
  mini: 9,
};

export function getLabelSize(variant: Variant): number {
  return LABEL_SIZES[variant];
}

export function computeCellSize(maxWidth: number, variant: Variant, gridSize: number): number {
  const labelSize = LABEL_SIZES[variant];
  return Math.floor((maxWidth - labelSize - 2) / gridSize);
}

export default function GameBoard({
  board,
  onCellPress,
  disabled,
  showShips = false,
  previewPositions = [],
  gridSize,
  isOpponent = false,
  maxWidth,
  variant,
  colLabelsBottom = false,
}: Props) {
  const effectiveGridSize = gridSize ?? board.length ?? 6;
  const labelSize = LABEL_SIZES[variant];
  const fontSize = FONT_SIZES[variant];
  const cellSize = computeCellSize(maxWidth, variant, effectiveGridSize);

  const colLabels = getColumnLabels(effectiveGridSize as GridSizeOption);
  const rowLabels = getRowLabels(effectiveGridSize as GridSizeOption);

  const previewSet = new Set(previewPositions.map(p => `${p.row},${p.col}`));

  const colLabelRow = (
    <View style={styles.headerRow}>
      {colLabels.map(label => (
        <Text
          key={label}
          style={[
            styles.label,
            {
              width: cellSize,
              height: labelSize,
              lineHeight: labelSize,
              fontSize,
            },
          ]}
        >
          {label}
        </Text>
      ))}
      <View style={{ width: labelSize, height: labelSize }} />
    </View>
  );

  return (
    <View style={styles.container} accessible accessibilityLabel={isOpponent ? 'Enemy grid' : 'Your grid'}>
      {!colLabelsBottom && colLabelRow}

      {/* Data rows: cells + row label on right */}
      <View style={styles.gridBody}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            <View style={rowIndex === 0 ? styles.firstCellRow : styles.cellRow}>
              {row.map((cell, colIndex) => {
                const isPreview = previewSet.has(`${rowIndex},${colIndex}`);
                const displayState = !showShips && cell.state === 'ship' ? 'empty' : cell.state;
                const isShipVisible = showShips || cell.state === 'hit' || cell.state === 'sunk';
                const shipColor = isShipVisible && cell.shipId ? getShipStyle(cell.shipId).color : undefined;

                return (
                  <Cell
                    key={`${rowIndex}-${colIndex}`}
                    state={displayState}
                    size={cellSize}
                    isPreview={isPreview}
                    disabled={disabled || cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk'}
                    row={rowIndex}
                    col={colIndex}
                    isOpponent={isOpponent}
                    shipColor={shipColor}
                    onPress={
                      onCellPress
                        ? () => onCellPress({ row: rowIndex, col: colIndex })
                        : undefined
                    }
                  />
                );
              })}
            </View>
            <Text
              style={[
                styles.label,
                {
                  width: labelSize,
                  height: cellSize,
                  lineHeight: cellSize,
                  fontSize,
                },
              ]}
            >
              {rowLabels[rowIndex]}
            </Text>
          </View>
        ))}
      </View>

      {colLabelsBottom && colLabelRow}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  headerRow: {
    flexDirection: 'row',
  },
  gridBody: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
  },
  row: {
    flexDirection: 'row',
  },
  cellRow: {
    flexDirection: 'row',
  },
  firstCellRow: {
    flexDirection: 'row',
  },
  label: {
    fontFamily: FONTS.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
