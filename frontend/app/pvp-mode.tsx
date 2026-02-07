import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useHaptics } from '../src/hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

export default function PvPModeScreen() {
  const router = useRouter();
  const haptics = useHaptics();

  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>PvP ONLINE</Text>
          <Text style={styles.subtitle}>Choose your battle mode</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.options}>
          <NavalButton
            title="RANDOM MATCH"
            subtitle="Find a random opponent"
            variant="pvp"
            onPress={() => {
              haptics.light();
              router.replace('/pvp-lobby');
            }}
          />
          <NavalButton
            title="PLAY WITH FRIEND"
            subtitle="Create or join a match"
            variant="pvp"
            onPress={() => {
              haptics.light();
              router.replace('/pvp-friend');
            }}
          />
        </View>

        <NavalButton
          title="BACK"
          variant="danger"
          size="small"
          onPress={() => {
            haptics.light();
            router.replace('/menu');
          }}
        />
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: COLORS.accent.gold,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.accent.gold,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  options: {
    gap: SPACING.md,
  },
});
