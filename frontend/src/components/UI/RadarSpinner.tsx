import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Props {
  size?: number;
}

export default function RadarSpinner({ size = 60 }: Props) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [rotation]);

  const rotateInterpolation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const r = size / 2;

  return (
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
          { transform: [{ rotate: rotateInterpolation }] },
        ]}
      >
        <View
          style={[
            styles.sweepLine,
            { height: r - 2, left: r - 1, bottom: r },
          ]}
        />
      </Animated.View>
      {/* Blips */}
      {[0.3, 0.6, 0.8].map((dist, i) => (
        <View
          key={i}
          style={[
            styles.blip,
            {
              left: r + Math.cos(Math.PI * (0.3 + i * 0.7)) * r * dist - 2,
              top: r - Math.sin(Math.PI * (0.3 + i * 0.7)) * r * dist - 2,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
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
    opacity: 0.6,
  },
});
