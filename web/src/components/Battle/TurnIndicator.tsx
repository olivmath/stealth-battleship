import React from 'react';
import { COLORS, FONTS, FONT_SIZES } from '../../shared/theme';
import styles from './TurnIndicator.module.css';

interface TurnIndicatorProps {
  isPlayerTurn: boolean;
  playerName?: string;
}

export function TurnIndicator({ isPlayerTurn, playerName = '' }: TurnIndicatorProps) {
  return (
    <div className={`${styles.indicator} ${isPlayerTurn ? styles.player : styles.enemy}`}
      style={{ fontFamily: FONTS.heading, fontSize: FONT_SIZES.sm }}>
      <div className={styles.dot} style={{ backgroundColor: isPlayerTurn ? COLORS.accent.gold : COLORS.accent.fire }} />
      {isPlayerTurn ? `${playerName}'s Turn` : "Enemy's Turn"}
    </div>
  );
}
