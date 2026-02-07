import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(subtitleFade, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <GradientContainer>
      <View style={styles.container}>
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <Text style={styles.title}>BATTLESHIP</Text>
          <View style={styles.divider} />
        </Animated.View>

        <Animated.View style={[styles.center, { opacity: subtitleFade }]}>
          <Text style={styles.subtitle}>ZERO KNOWLEDGE</Text>
          <View style={styles.spinnerWrap}>
            <RadarSpinner size={50} />
          </View>
          <Text style={styles.loading}>INITIALIZING SYSTEMS...</Text>
        </Animated.View>
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 38,
    color: COLORS.text.accent,
    letterSpacing: 6,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: COLORS.accent.gold,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  center: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  subtitle: {
    fontFamily: FONTS.headingLight,
    fontSize: 14,
    color: COLORS.text.secondary,
    letterSpacing: 8,
  },
  spinnerWrap: {
    marginTop: SPACING.md,
  },
  loading: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.secondary,
    letterSpacing: 3,
    opacity: 0.6,
  },
});
