import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS, FONTS } from '../../shared/theme';

interface Props {
  size?: number;
  label?: string;
}

function BlipDot({ cx, cy, delay }: { cx: number; cy: number; delay: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.blip,
        { left: cx - 2, top: cy - 2 },
        animStyle,
      ]}
    />
  );
}

export default function RadarSpinner({ size = 60, label }: Props) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }],
  }));

  const r = size / 2;

  return (
    <View style={styles.wrapper} accessibilityLabel="Loading" accessibilityRole="progressbar">
      <View style={[styles.container, { width: size, height: size }]}>
        {/* Outer ring */}
        <View
          style={[
            styles.ring,
            { width: size, height: size, borderRadius: r },
          ]}
        />
        {/* Inner ring */}
        <View
          style={[
            styles.ring,
            { width: size * 0.6, height: size * 0.6, borderRadius: r * 0.6 },
          ]}
        />
        {/* Center dot */}
        <View style={styles.centerDot} />
        {/* Sweep line */}
        <Animated.View
          style={[
            styles.sweepContainer,
            { width: size, height: size },
            sweepStyle,
          ]}
        >
          <View
            style={[
              styles.sweepLine,
              { height: r - 2, left: r - 1, bottom: r },
            ]}
          />
        </Animated.View>
        {/* Blips with staggered blink */}
        {[0.3, 0.6, 0.8].map((dist, i) => (
          <BlipDot
            key={i}
            cx={r + Math.cos(Math.PI * (0.3 + i * 0.7)) * r * dist}
            cy={r - Math.sin(Math.PI * (0.3 + i * 0.7)) * r * dist}
            delay={i * 700}
          />
        ))}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 12,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: COLORS.overlay.goldStrong,
  },
  centerDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent.gold,
  },
  sweepContainer: {
    position: 'absolute',
  },
  sweepLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: COLORS.accent.gold,
    opacity: 0.8,
  },
  blip: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent.gold,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: COLORS.text.secondary,
  },
});
