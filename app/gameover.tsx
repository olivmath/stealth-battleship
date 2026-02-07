import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useGame } from '../src/context/GameContext';
import { useHaptics } from '../src/hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

export default function GameOverScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const haptics = useHaptics();

  const isVictory = state.winner === 'player';
  const accuracy = state.shotsFired > 0
    ? Math.round((state.shotsHit / state.shotsFired) * 100)
    : 0;
  const playerShipsLost = state.playerShips.filter(s => s.isSunk).length;

  const handlePlayAgain = () => {
    haptics.light();
    dispatch({ type: 'RESET_GAME' });
    router.replace('/placement');
  };

  const handleMenu = () => {
    haptics.light();
    router.replace('/menu');
  };

  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.result, isVictory ? styles.victory : styles.defeat]}>
            {isVictory ? 'VICTORY' : 'DEFEAT'}
          </Text>
          <Text style={styles.subtitle}>
            {isVictory ? 'Enemy fleet destroyed' : 'Your fleet has been sunk'}
          </Text>
          <View style={[styles.divider, { backgroundColor: isVictory ? COLORS.accent.gold : COLORS.accent.fire }]} />
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>BATTLE REPORT</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.shotsFired}</Text>
              <Text style={styles.statLabel}>SHOTS FIRED</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{accuracy}%</Text>
              <Text style={styles.statLabel}>ACCURACY</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{playerShipsLost}/{state.playerShips.length}</Text>
              <Text style={styles.statLabel}>SHIPS LOST</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <NavalButton title="PLAY AGAIN" onPress={handlePlayAgain} />
          <NavalButton title="RETURN TO BASE" onPress={handleMenu} variant="secondary" />
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
    marginTop: SPACING.xxl,
  },
  result: {
    fontFamily: FONTS.heading,
    fontSize: 42,
    letterSpacing: 6,
  },
  victory: {
    color: COLORS.accent.gold,
  },
  defeat: {
    color: COLORS.accent.fire,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  divider: {
    width: 80,
    height: 2,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  statsContainer: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    padding: SPACING.lg,
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
  },
  statsTitle: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    marginBottom: SPACING.lg,
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
    fontSize: 24,
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
});
