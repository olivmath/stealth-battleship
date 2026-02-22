import React from 'react';
import { Cell } from './Cell';
import { COLORS, FONTS, FONT_SIZES } from '../../shared/theme';
import { getColumnLabels } from '../../shared/constants';
import styles from './GameBoard.module.css';
import type { Board, Position } from '../../shared/entities';

export function computeCellSize(maxWidth: number, variant: string, gridSize: number): number {
  const labelSize = getLabelSize(variant);
  return Math.floor((maxWidth - labelSize - 2) / gridSize);
}

export function getLabelSize(variant: string): number {
  return variant === 'mini' ? 10 : 14;
}

interface GameBoardProps {
  board: Board;
  gridSize: number;
  cellSize?: number;
  maxWidth?: number;
  variant?: string;
  showShips?: boolean;
  onCellPress?: (pos: Position) => void;
  disabled?: boolean;
  previewCells?: Set<string>;
  invalidPreview?: boolean;
  label?: string;
  mini?: boolean;
  lastAttackPosition?: any;
  colLabelsBottom?: boolean;
  isOpponent?: boolean;
}

export function GameBoard({ board, gridSize, cellSize: cellSizeProp, maxWidth, variant, showShips, onCellPress, disabled, previewCells, invalidPreview, label, mini, lastAttackPosition, colLabelsBottom, isOpponent }: GameBoardProps) {
  const isMini = mini || variant === 'mini';
  const colLabels = getColumnLabels(gridSize as any);
  const labelSize = isMini ? 10 : 14;
  const cellSize = cellSizeProp ?? (maxWidth ? computeCellSize(maxWidth, variant || (isMini ? 'mini' : 'full'), gridSize) : 28);

  return (
    <div className={styles.wrapper}>
      {label && <div className={styles.label} style={{ fontFamily: FONTS.heading, fontSize: FONT_SIZES.label, color: COLORS.text.secondary }}>{label}</div>}
      <div className={styles.board}>
        {/* Column labels */}
        <div className={styles.colLabels} style={{ marginLeft: labelSize + 2 }}>
          {colLabels.map((l, i) => (
            <div key={i} style={{ width: cellSize, textAlign: 'center', fontFamily: FONTS.heading, fontSize: mini ? 7 : 9, color: COLORS.text.secondary }}>{l}</div>
          ))}
        </div>
        {/* Rows */}
        {board.map((row, r) => (
          <div key={r} className={styles.row}>
            <div style={{ width: labelSize, textAlign: 'center', fontFamily: FONTS.heading, fontSize: mini ? 7 : 9, color: COLORS.text.secondary, lineHeight: `${cellSize}px` }}>{r + 1}</div>
            {row.map((cell, c) => {
              const key = `${r},${c}`;
              const isPreview = previewCells?.has(key);
              return (
                <Cell key={key} state={cell.state} size={cellSize} showShip={showShips}
                  isPreview={isPreview} onPress={onCellPress ? () => onCellPress({ row: r, col: c }) : undefined}
                  disabled={disabled || cell.state !== 'empty'} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
