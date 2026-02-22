import React, { useState, useEffect, useRef } from 'react';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../shared/theme';

interface Props {
  duration: number;
  isActive: boolean;
  isPlayerTurn: boolean;
  onExpire?: () => void;
}

export function TurnTimer({ duration, isActive, isPlayerTurn, onExpire }: Props) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setTimeLeft(duration);
  }, [isPlayerTurn, duration]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPlayerTurn]);

  const progress = duration > 0 ? (timeLeft / duration) * 100 : 0;
  const barColor = isPlayerTurn ? COLORS.accent.gold : COLORS.accent.fire;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
    }}>
      <div style={{
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.surface.elevated,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 3,
          width: `${progress}%`,
          backgroundColor: barColor,
          transition: 'width 1s linear',
        }} />
      </div>
      <span style={{
        fontFamily: FONTS.body,
        fontSize: FONT_SIZES.body,
        color: barColor,
        width: 32,
        textAlign: 'right',
      }}>
        {timeLeft}s
      </span>
    </div>
  );
}
