import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useGame } from '../src/context/GameContext';
import { usePlayerStats, useSettings } from '../src/hooks/useStorage';
import { useHaptics } from '../src/hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

export default function MenuScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const { stats, refresh } = usePlayerStats();
  const { settings, refresh: refreshSettings } = useSettings();
  const haptics = useHaptics();

  useEffect(() => {
    refresh();
    refreshSettings();
  }, [refresh, refreshSettings]);

  useEffect(() => {
    if (stats) {
      dispatch({ type: 'LOAD_STATS', stats });
    }
  }, [stats, dispatch]);

  useEffect(() => {
    if (settings) {
      dispatch({ type: 'LOAD_SETTINGS', settings });
    }
  }, [settings, dispatch]);

  const handleStartBattle = () => {
    haptics.light();
    dispatch({ type: 'RESET_GAME' });
    router.replace('/tutorial');
  };

  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcome}>WELCOME BACK</Text>
          <Text style={styles.name}>{state.playerName}</Text>
          <View style={styles.divider} />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <NavalButton
            title="START BATTLE"
            onPress={handleStartBattle}
          />
          <NavalButton
            title="MATCH HISTORY"
            onPress={() => {
              haptics.light();
              router.replace('/match-history');
            }}
            variant="secondary"
          />
          <NavalButton
            title="PROFILE"
            onPress={() => {
              haptics.light();
              router.replace('/profile');
            }}
            variant="secondary"
          />
          <NavalButton
            title="SETTINGS"
            onPress={() => {
              haptics.light();
              router.replace('/settings');
            }}
            variant="secondary"
          />
          <NavalButton
            title="PvP ONLINE"
            onPress={() => {}}
            disabled
          />
          <Text style={styles.comingSoon}>COMING SOON — ZK PROOF MULTIPLAYER</Text>
        </View>
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  welcome: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.text.secondary,
    letterSpacing: 3,
  },
  name: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: COLORS.text.accent,
    letterSpacing: 2,
    marginTop: SPACING.xs,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.accent.gold,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  actions: {
    gap: SPACING.md,
  },
  comingSoon: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.secondary,
    textAlign: 'center',
    letterSpacing: 1,
    opacity: 0.5,
  },
});
