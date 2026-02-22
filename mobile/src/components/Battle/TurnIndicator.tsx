import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '../../shared/theme';

interface Props {
  isPlayerTurn: boolean;
}

export default function TurnIndicator({ isPlayerTurn }: Props) {
  const { t } = useTranslation();
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.3, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View
      style={[styles.container, !isPlayerTurn && styles.enemyContainer]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={isPlayerTurn ? 'Your turn. Tap a cell to fire.' : 'Enemy is firing. Please wait.'}
    >
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: isPlayerTurn ? COLORS.accent.gold : COLORS.accent.fire },
          dotStyle,
        ]}
      />
      <Text style={[styles.text, !isPlayerTurn && styles.enemyText]}>
        {isPlayerTurn ? t('turnIndicator.yourTurn') : t('turnIndicator.enemyFiring')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.accent.gold,
    backgroundColor: COLORS.overlay.goldMedium,
  },
  enemyContainer: {
    borderColor: COLORS.accent.fire,
    backgroundColor: COLORS.overlay.fireGlow,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  text: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.text.accent,
    letterSpacing: 2,
  },
  enemyText: {
    color: COLORS.accent.fire,
  },
});
