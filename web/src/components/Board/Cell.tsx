import React, { memo, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { CellState } from '../../shared/entities';
import { COLORS } from '../../shared/theme';
import styles from './Cell.module.css';

interface CellProps {
  state: CellState;
  size: number;
  onPress?: () => void;
  disabled?: boolean;
  isPreview?: boolean;
  isInvalid?: boolean;
  row?: number;
  col?: number;
  isOpponent?: boolean;
  shipColor?: string;
  isLastAttack?: boolean;
}

function getCellLabel(
  row: number | undefined,
  col: number | undefined,
  state: CellState
): string {
  if (row == null || col == null) return state;
  const letter = String.fromCharCode(65 + row);
  const num = col + 1;
  return `${letter}${num}, ${state}`;
}

function getCellColor(state: CellState): string {
  switch (state) {
    case 'empty':
      return COLORS.cell.empty;
    case 'ship':
      return COLORS.cell.ship;
    case 'hit':
      return COLORS.cell.hit;
    case 'miss':
      return COLORS.cell.miss;
    case 'sunk':
      return COLORS.cell.sunk;
    default:
      return COLORS.cell.empty;
  }
}

export const Cell = memo(function Cell({
  state,
  size,
  onPress,
  disabled,
  isPreview,
  isInvalid,
  row,
  col,
  isOpponent,
  shipColor,
  isLastAttack,
}: CellProps) {
  const flashControls = useAnimation();
  const overlayControls = useAnimation();

  useEffect(() => {
    if (isLastAttack) {
      flashControls.start({
        scale: [1, 1.3, 1],
        transition: { duration: 0.3, times: [0, 0.5, 1] },
      });
      overlayControls.start({
        opacity: [0, 0.6, 0],
        transition: { duration: 0.3, times: [0, 0.33, 1] },
      });
    }
  }, [isLastAttack, flashControls, overlayControls]);

  const baseBgColor =
    shipColor && state === 'ship'
      ? shipColor
      : shipColor && state === 'sunk'
        ? `${shipColor}33`
        : getCellColor(state);

  const bgColor = isInvalid
    ? COLORS.overlay.fireHit
    : isPreview
      ? COLORS.overlay.goldPreview
      : baseBgColor;

  const borderColor = isInvalid
    ? COLORS.accent.fire
    : isPreview
      ? COLORS.accent.gold
      : state === 'hit'
        ? COLORS.accent.fire
        : state === 'sunk'
          ? (shipColor ?? COLORS.accent.fireDark)
          : COLORS.grid.border;

  const label = getCellLabel(row, col, state);

  return (
    <motion.div animate={flashControls}>
      <button
        className={styles.cell}
        onClick={disabled || !onPress ? undefined : onPress}
        disabled={disabled || !onPress}
        role="button"
        aria-label={label}
        aria-description={
          isOpponent && state === 'empty' ? 'Click to fire' : undefined
        }
        onContextMenu={(e) => e.preventDefault()}
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
          borderColor,
          cursor: onPress && !disabled ? 'crosshair' : 'default',
          position: 'relative',
        }}
      >
        {state === 'hit' && (
          <div className={styles.hitMarker}>
            <span className={styles.hitMarkerText}>X</span>
          </div>
        )}
        {state === 'miss' && (
          <div className={styles.missMarker}>
            <span className={styles.missMarkerText}>{'\u2022'}</span>
          </div>
        )}
        {state === 'sunk' && (
          <div
            className={styles.sunkMarker}
            style={shipColor ? { backgroundColor: shipColor } : undefined}
          >
            <span className={styles.sunkMarkerText}>X</span>
          </div>
        )}
        {/* Flash overlay for enemy attacks */}
        <motion.div
          animate={overlayControls}
          initial={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#FFFFFF',
            pointerEvents: 'none',
          }}
        />
      </button>
    </motion.div>
  );
});
