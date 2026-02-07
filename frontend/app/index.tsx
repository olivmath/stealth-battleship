import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useGame } from '../src/context/GameContext';
import { useHaptics } from '../src/hooks/useHaptics';
import { getPlayerName, savePlayerName } from '../src/storage/scores';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { dispatch } = useGame();
  const haptics = useHaptics();

  useEffect(() => {
    getPlayerName().then(saved => {
      if (saved) {
        setName(saved);
      }
      setLoading(false);
    });
  }, []);

  const handleEnter = async () => {
    if (!name.trim()) return;
    haptics.light();
    await savePlayerName(name.trim());
    dispatch({ type: 'SET_PLAYER', name: name.trim() });
    router.replace('/menu');
  };

  if (loading) return null;

  return (
    <GradientContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>BATTLESHIP</Text>
          <Text style={styles.subtitle}>ZERO KNOWLEDGE</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>COMMANDER NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your callsign..."
            placeholderTextColor={COLORS.text.secondary}
            autoCapitalize="words"
            returnKeyType="go"
            onSubmitEditing={handleEnter}
            accessibilityLabel="Commander name"
            accessibilityHint="Enter your name to begin"
          />
          <NavalButton
            title="ENTER BATTLE"
            onPress={handleEnter}
            disabled={!name.trim()}
            style={styles.button}
          />
        </View>

        <Text style={styles.version}>v1.0.0 • VISUAL MVP</Text>
      </KeyboardAvoidingView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 32,
    color: COLORS.text.accent,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: FONTS.headingLight,
    fontSize: 14,
    color: COLORS.text.secondary,
    letterSpacing: 6,
    marginTop: SPACING.xs,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.accent.gold,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  form: {
    gap: SPACING.md,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: 'rgba(30, 58, 95, 0.3)',
  },
  button: {
    marginTop: SPACING.sm,
  },
  version: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.xxl,
    opacity: 0.5,
  },
});
