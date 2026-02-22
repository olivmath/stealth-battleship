import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import PinModal from '../src/components/UI/PinModal';
import { useGame } from '../src/game/translator';
import { useHaptics } from '../src/hooks/useHaptics';
import { getPlayerName, savePlayerName } from '../src/game/adapter';
import { hasWallet, getSecretKey } from '../src/wallet/interactor';
import { COLORS, FONTS, SPACING } from '../src/shared/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const router = useRouter();
  const { dispatch } = useGame();
  const haptics = useHaptics();

  useEffect(() => {
    getPlayerName().then(async (saved) => {
      if (saved) {
        dispatch({ type: 'SET_PLAYER', name: saved });
        const walletExists = await hasWallet();
        if (walletExists) {
          // Returning user with wallet — ask for PIN
          setShowPin(true);
          setLoading(false);
        } else {
          // Returning user without wallet — send to wallet setup
          router.replace('/wallet-setup');
        }
        return;
      }
      setLoading(false);
    });
  }, []);

  const handleEnter = async () => {
    if (!name.trim()) return;
    haptics.light();
    await savePlayerName(name.trim());
    dispatch({ type: 'SET_PLAYER', name: name.trim() });
    // New user — always go to wallet setup
    router.replace('/wallet-setup');
  };

  const handlePinSuccess = async (pin: string) => {
    try {
      await getSecretKey(pin); // validates PIN
      setShowPin(false);
      haptics.success();
      router.replace('/menu');
    } catch {
      Alert.alert(t('wallet.view.errorTitle'), t('wallet.view.errorInvalidPin'));
    }
  };

  if (loading && !showPin) return (
    <GradientContainer>
      <View style={styles.loadingContainer}>
        <RadarSpinner size={50} />
      </View>
    </GradientContainer>
  );

  if (showPin) return (
    <GradientContainer>
      <View style={styles.loadingContainer}>
        <PinModal
          visible={true}
          onSubmit={handlePinSuccess}
          onCancel={() => {
            // Cannot cancel PIN on login — just dismiss and stay
            setShowPin(false);
            setLoading(false);
          }}
        />
      </View>
    </GradientContainer>
  );

  return (
    <GradientContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t('login.label')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('login.placeholder')}
            placeholderTextColor={COLORS.text.secondary}
            autoCapitalize="words"
            returnKeyType="go"
            onSubmitEditing={handleEnter}
            accessibilityLabel="Commander name"
            accessibilityHint="Enter your name to begin"
          />
          <NavalButton
            title={t('login.button')}
            onPress={handleEnter}
            disabled={!name.trim()}
            style={styles.button}
          />
        </View>

        <Text style={styles.version}>{t('login.version')}</Text>
      </KeyboardAvoidingView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    backgroundColor: COLORS.surface.cardBorder,
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
