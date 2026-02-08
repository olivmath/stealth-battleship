import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import { getPlayerName } from '../src/storage/scores';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

export default function SplashScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const [splashDelay, setSplashDelay] = useState<number | null>(null);

  // Check if returning user for shorter splash
  useEffect(() => {
    getPlayerName().then(name => {
      setSplashDelay(name ? 1500 : 3000);
    });
  }, []);

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
  }, []);

  useEffect(() => {
    if (splashDelay === null) return;
    const timer = setTimeout(() => {
      router.replace('/login');
    }, splashDelay);
    return () => clearTimeout(timer);
  }, [splashDelay]);

  return (
    <GradientContainer>
      <View style={styles.container}>
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <Text style={styles.title}>{t('splash.title')}</Text>
          <View style={styles.divider} />
        </Animated.View>

        <Animated.View style={[styles.center, { opacity: subtitleFade }]}>
          <Text style={styles.subtitle}>{t('splash.subtitle')}</Text>
          <View style={styles.spinnerWrap}>
            <RadarSpinner size={50} />
          </View>
          <Text style={styles.loading}>{t('splash.loading')}</Text>
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
