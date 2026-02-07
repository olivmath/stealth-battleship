import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface Props {
  duration: number;
  isActive: boolean;
  isPlayerTurn: boolean;
  onExpire?: () => void;
}

export default function TurnTimer({ duration, isActive, isPlayerTurn, onExpire }: Props) {
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
    <View style={styles.container}>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.text, { color: barColor }]}>{timeLeft}s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(30, 58, 95, 0.4)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: 13,
    width: 32,
    textAlign: 'right',
  },
});
