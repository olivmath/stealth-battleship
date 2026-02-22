import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { COLORS, RADIUS } from '../../shared/theme';
import styles from './Cell.module.css';

type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

interface CellProps {
  state: CellState;
  size: number;
  isPreview?: boolean;
  isInvalid?: boolean;
  showShip?: boolean;
  shipColor?: string;
  onPress?: () => void;
  disabled?: boolean;
}

const stateColors: Record<CellState, string> = {
  empty: COLORS.cell.empty,
  ship: COLORS.cell.ship,
  hit: COLORS.cell.hit,
  miss: COLORS.cell.miss,
  sunk: COLORS.cell.sunk,
};

export const Cell = memo(function Cell({ state, size, isPreview, isInvalid, showShip, shipColor, onPress, disabled }: CellProps) {
  const bg = isPreview ? COLORS.overlay.goldPreview : stateColors[showShip && state === 'ship' ? 'ship' : state === 'ship' ? 'empty' : state];

  return (
    <motion.button
      className={styles.cell}
      onClick={disabled ? undefined : onPress}
      disabled={disabled || !onPress}
      animate={state === 'hit' ? { scale: [1, 1.2, 1] } : undefined}
      transition={{ duration: 0.3 }}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        cursor: onPress && !disabled ? 'crosshair' : 'default',
      }}
    >
      {state === 'hit' && <div className={styles.hitMarker} style={{ backgroundColor: COLORS.marker.hitDot }} />}
      {state === 'miss' && <div className={styles.missMarker} style={{ backgroundColor: COLORS.marker.miss }} />}
      {state === 'sunk' && <div className={styles.sunkMarker} style={{ backgroundColor: COLORS.marker.sunkShip }} />}
    </motion.button>
  );
});
