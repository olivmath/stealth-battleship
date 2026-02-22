import React from 'react';
import { NavalText } from '../UI/NavalText';
import { COLORS, RADIUS } from '../../shared/theme';
import styles from './TurnTimer.module.css';

interface TurnTimerProps {
  seconds?: number;
  maxSeconds?: number;
  duration?: number;
  isActive?: boolean;
  isPlayerTurn?: boolean;
  onExpire?: () => void;
}

export function TurnTimer({ seconds: secondsProp, maxSeconds: maxSecondsProp, duration, isActive, isPlayerTurn, onExpire }: TurnTimerProps) {
  const maxSeconds = maxSecondsProp ?? duration ?? 30;
  const seconds = secondsProp ?? maxSeconds;
  const pct = (seconds / maxSeconds) * 100;
  const color = pct > 50 ? COLORS.accent.gold : pct > 25 ? COLORS.accent.fire : COLORS.accent.fireDark;

  return (
    <div className={styles.wrapper}>
      <div className={styles.bar} style={{ backgroundColor: COLORS.surface.subtle }}>
        <div className={styles.fill} style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <NavalText variant="caption" color={color}>{seconds}s</NavalText>
    </div>
  );
}
