import React from 'react';
import { Cell } from './Cell';
import { COLORS, FONTS } from '../../shared/theme';
import { getColumnLabels, getRowLabels, getShipStyle } from '../../shared/constants';
import styles from './GameBoard.module.css';
import type { Board, Position, GridSizeOption } from '../../shared/entities';

type Variant = 'full' | 'mini';

interface GameBoardProps {
  board: Board;
  onCellPress?: (pos: Position) => void;
  disabled?: boolean;
  showShips?: boolean;
  previewPositions?: Position[];
  gridSize?: number;
  isOpponent?: boolean;
  maxWidth: number;
  variant: Variant;
  colLabelsBottom?: boolean;
  lastAttackPosition?: Position | null;
  // Legacy props for backward compat
  cellSize?: number;
  previewCells?: Set<string>;
  invalidPreview?: boolean;
  label?: string;
  mini?: boolean;
}

const LABEL_SIZES: Record<Variant, number> = {
  full: 24,
  mini: 14,
};

const FONT_SIZES_MAP: Record<Variant, number> = {
  full: 11,
  mini: 9,
};

export function getLabelSize(variant: string): number {
  return LABEL_SIZES[variant as Variant] ?? 24;
}

export function computeCellSize(
  maxWidth: number,
  variant: string,
  gridSize: number
): number {
  const labelSize = getLabelSize(variant);
  return Math.floor((maxWidth - labelSize - 2) / gridSize);
}

export function GameBoard({
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
  lastAttackPosition,
  cellSize: cellSizeProp,
  previewCells,
  invalidPreview,
  label,
  mini,
}: GameBoardProps) {
  const effectiveVariant: Variant = mini ? 'mini' : (variant ?? 'full');
  const effectiveGridSize = gridSize ?? board.length ?? 10;
  const labelSize = LABEL_SIZES[effectiveVariant];
  const fontSize = FONT_SIZES_MAP[effectiveVariant];
  const cellSize =
    cellSizeProp ??
    (maxWidth
      ? computeCellSize(maxWidth, effectiveVariant, effectiveGridSize)
      : 28);

  const colLabels = getColumnLabels(effectiveGridSize as GridSizeOption);
  const rowLabels = getRowLabels(effectiveGridSize as GridSizeOption);

  // Support both previewPositions (mobile-style) and previewCells (legacy web-style)
  const previewSet =
    previewCells ??
    new Set(previewPositions.map((p) => `${p.row},${p.col}`));

  const colLabelRow = (
    <div className={styles.colLabels}>
      {colLabels.map((lbl) => (
        <span
          key={lbl}
          style={{
            width: cellSize,
            height: labelSize,
            lineHeight: `${labelSize}px`,
            fontSize,
            fontFamily: FONTS.body,
            color: COLORS.text.secondary,
            textAlign: 'center',
            display: 'inline-block',
          }}
        >
          {lbl}
        </span>
      ))}
      <span style={{ width: labelSize, height: labelSize, display: 'inline-block' }} />
    </div>
  );

  return (
    <div
      className={styles.wrapper}
      role="grid"
      aria-label={isOpponent ? 'Enemy grid' : 'Your grid'}
    >
      {label && (
        <div
          className={styles.label}
          style={{
            fontFamily: FONTS.heading,
            fontSize: 10,
            color: COLORS.text.secondary,
          }}
        >
          {label}
        </div>
      )}

      {!colLabelsBottom && colLabelRow}

      {/* Data rows: cells + row label on right */}
      <div
        className={styles.gridBody}
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: COLORS.grid.border,
        }}
      >
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              {row.map((cell, colIndex) => {
                const key = `${rowIndex},${colIndex}`;
                const isPreview = previewSet.has(key);
                const displayState =
                  !showShips && cell.state === 'ship' ? 'empty' : cell.state;
                const isShipVisible =
                  showShips ||
                  cell.state === 'hit' ||
                  cell.state === 'sunk';
                const shipColor =
                  isShipVisible && cell.shipId
                    ? getShipStyle(cell.shipId).color
                    : undefined;

                const isLastAttack = lastAttackPosition
                  ? lastAttackPosition.row === rowIndex &&
                    lastAttackPosition.col === colIndex
                  : false;

                return (
                  <Cell
                    key={`${rowIndex}-${colIndex}`}
                    state={displayState}
                    size={cellSize}
                    isPreview={isPreview}
                    isInvalid={isPreview && invalidPreview}
                    disabled={
                      disabled ||
                      cell.state === 'hit' ||
                      cell.state === 'miss' ||
                      cell.state === 'sunk'
                    }
                    row={rowIndex}
                    col={colIndex}
                    isOpponent={isOpponent}
                    shipColor={shipColor}
                    isLastAttack={isLastAttack}
                    onPress={
                      onCellPress
                        ? () => onCellPress({ row: rowIndex, col: colIndex })
                        : undefined
                    }
                  />
                );
              })}
            </div>
            <span
              style={{
                width: labelSize,
                height: cellSize,
                lineHeight: `${cellSize}px`,
                fontSize,
                fontFamily: FONTS.body,
                color: COLORS.text.secondary,
                textAlign: 'center',
                display: 'inline-block',
              }}
            >
              {rowLabels[rowIndex]}
            </span>
          </div>
        ))}
      </div>

      {colLabelsBottom && colLabelRow}
    </div>
  );
}
