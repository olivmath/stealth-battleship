import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useGame } from '../src/context/GameContext';
import { usePlayerStats } from '../src/hooks/useStorage';
import { useHaptics } from '../src/hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

export default function MenuScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const { stats, refresh } = usePlayerStats();
  const haptics = useHaptics();

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (stats) {
      dispatch({ type: 'LOAD_STATS', stats });
    }
  }, [stats, dispatch]);

  const winRate = stats.wins + stats.losses > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

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

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>COMBAT RECORD</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.wins}</Text>
              <Text style={styles.statLabel}>VICTORIES</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.losses}</Text>
              <Text style={styles.statLabel}>DEFEATS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{winRate}%</Text>
              <Text style={styles.statLabel}>WIN RATE</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <NavalButton
            title="START BATTLE"
            onPress={handleStartBattle}
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
    justifyContent: 'space-between',
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
  statsContainer: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
  },
  statsTitle: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: COLORS.text.primary,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginTop: SPACING.xs,
  },
  actions: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
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
