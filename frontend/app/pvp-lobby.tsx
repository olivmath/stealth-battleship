import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import OpponentStatus from '../src/components/PvP/OpponentStatus';
import { useGame } from '../src/context/GameContext';
import { useHaptics } from '../src/hooks/useHaptics';
import { MOCK_OPPONENT, MATCHMAKING_DELAY, FOUND_DELAY } from '../src/services/pvpMock';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

export default function PvPLobbyScreen() {
  const router = useRouter();
  const { dispatch } = useGame();
  const haptics = useHaptics();
  const [phase, setPhase] = useState<'searching' | 'found'>('searching');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('found');
      haptics.medium();

      const t2 = setTimeout(() => {
        dispatch({ type: 'RESET_GAME' });
        router.replace('/pvp-placement');
      }, FOUND_DELAY);

      timersRef.current.push(t2);
    }, MATCHMAKING_DELAY);

    timersRef.current.push(t1);

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.content}>
          {phase === 'searching' ? (
            <>
              <RadarSpinner size={120} />
              <Text style={styles.statusText}>SEARCHING FOR OPPONENT...</Text>
            </>
          ) : (
            <>
              <OpponentStatus name={MOCK_OPPONENT} status="online" />
              <Text style={styles.foundText}>OPPONENT FOUND!</Text>
            </>
          )}
        </View>

        {phase === 'searching' && (
          <NavalButton
            title="CANCEL"
            variant="danger"
            onPress={() => {
              timersRef.current.forEach(clearTimeout);
              router.replace('/menu');
            }}
          />
        )}
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  statusText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.text.secondary,
    letterSpacing: 3,
  },
  foundText: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.accent.victory,
    letterSpacing: 3,
  },
});
