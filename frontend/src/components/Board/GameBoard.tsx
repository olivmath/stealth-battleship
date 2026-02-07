import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Cell from './Cell';
import CoordinateLabels from './CoordinateLabels';
import { Board, Position } from '../../types/game';
import { GRID_SIZE } from '../../constants/game';
import { COLORS, SPACING } from '../../constants/theme';

interface Props {
  board: Board;
  onCellPress?: (position: Position) => void;
  disabled?: boolean;
  showShips?: boolean;
  previewPositions?: Position[];
  compact?: boolean;
  gridSize?: number;
  isOpponent?: boolean;
  maxWidth?: number;
  hideLabels?: boolean;
}

const LABEL_WIDTH = 20;

export default function GameBoard({
  board,
  onCellPress,
  disabled,
  showShips = false,
  previewPositions = [],
  compact = false,
  gridSize,
  isOpponent = false,
  maxWidth,
  hideLabels = false,
}: Props) {
  const effectiveGridSize = gridSize ?? board.length ?? GRID_SIZE;
  const screenWidth = Dimensions.get('window').width;
  const labelW = hideLabels ? 0 : LABEL_WIDTH;
  const maxGridWidth = maxWidth
    ? maxWidth - labelW
    : compact
      ? screenWidth * 0.45
      : screenWidth - SPACING.lg * 2 - LABEL_WIDTH;
  const cellSize = Math.floor(maxGridWidth / effectiveGridSize);

  const previewSet = new Set(previewPositions.map(p => `${p.row},${p.col}`));

  return (
    <View style={styles.container} accessible accessibilityLabel={isOpponent ? 'Enemy grid' : 'Your grid'}>
      {!hideLabels && <CoordinateLabels cellSize={cellSize} gridSize={effectiveGridSize} />}
      <View style={[styles.grid, !hideLabels && { marginLeft: LABEL_WIDTH }]}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => {
              const isPreview = previewSet.has(`${rowIndex},${colIndex}`);
              const displayState = !showShips && cell.state === 'ship' ? 'empty' : cell.state;

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
                  onPress={
                    onCellPress
                      ? () => onCellPress({ row: rowIndex, col: colIndex })
                      : undefined
                  }
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  grid: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
  },
  row: {
    flexDirection: 'row',
  },
});
