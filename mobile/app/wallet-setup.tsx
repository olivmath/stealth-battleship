import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import PinModal from '../src/components/UI/PinModal';
import { useHaptics } from '../src/hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../src/shared/theme';
import { createWallet, importWallet } from '../src/wallet/interactor';

type Mode = 'choose' | 'create' | 'import';

export default function WalletSetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const haptics = useHaptics();

  const [mode, setMode] = useState<Mode>('choose');
  const [secretInput, setSecretInput] = useState('');
  const [secretConfirmed, setSecretConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [tempPin, setTempPin] = useState('');

  // Reset after pin mismatch error
  useEffect(() => {
    if (pinError) {
      const timer = setTimeout(() => {
        setPinError(false);
        setPinStep('enter');
        setTempPin('');
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [pinError]);

  const handleCreate = async (pinValue: string) => {
    setLoading(true);
    setError('');
    try {
      await createWallet(pinValue);
      haptics.success();
      router.replace('/menu');
    } catch (e: any) {
      setError(e.message || t('wallet.setup.errorGeneric'));
      setLoading(false);
    }
  };

  const handleImport = async (pinValue: string) => {
    if (!secretInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      await importWallet(secretInput, pinValue);
      haptics.success();
      router.replace('/menu');
    } catch (e: any) {
      setError(t('wallet.setup.errorInvalidKey'));
      setLoading(false);
    }
  };

  const handlePinSubmit = (enteredPin: string) => {
    if (pinStep === 'enter') {
      setTempPin(enteredPin);
      setPinStep('confirm');
      setPinError(false);
    } else {
      if (enteredPin === tempPin) {
        if (mode === 'create') {
          handleCreate(enteredPin);
        } else {
          handleImport(enteredPin);
        }
      } else {
        setPinError(true);
      }
    }
  };

  const resetFlow = () => {
    setMode('choose');
    setTempPin('');
    setPinStep('enter');
    setPinError(false);
    setSecretInput('');
    setSecretConfirmed(false);
    setError('');
  };

  if (loading) {
    return (
      <GradientContainer>
        <View style={styles.center}>
          <RadarSpinner size={50} />
          <Text style={styles.loadingText}>{t('wallet.setup.generating')}</Text>
        </View>
      </GradientContainer>
    );
  }

  if (mode === 'choose') {
    return (
      <GradientContainer>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('wallet.setup.title')}</Text>
            <Text style={styles.subtitle}>{t('wallet.setup.subtitle')}</Text>
            <View style={styles.divider} />
          </View>
          <View style={styles.actions}>
            <NavalButton
              title={t('wallet.setup.createNew')}
              subtitle={t('wallet.setup.createNewSub')}
              onPress={() => { haptics.light(); setMode('create'); }}
            />
            <NavalButton
              title={t('wallet.setup.importExisting')}
              subtitle={t('wallet.setup.importExistingSub')}
              variant="secondary"
              onPress={() => { haptics.light(); setMode('import'); }}
            />
          </View>
        </View>
      </GradientContainer>
    );
  }

  // Import mode: show secret key input first, then PIN flow
  if (mode === 'import' && !secretConfirmed) {
    return (
      <GradientContainer>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('wallet.setup.importTitle')}</Text>
            <View style={styles.divider} />
          </View>
          <View style={styles.form}>
            <Text style={styles.label}>{t('wallet.setup.secretKeyLabel')}</Text>
            <TextInput
              style={[styles.input, styles.secretInput]}
              value={secretInput}
              onChangeText={setSecretInput}
              placeholder={t('wallet.setup.secretKeyPlaceholder')}
              placeholderTextColor={COLORS.text.secondary}
              autoCapitalize="characters"
              autoCorrect={false}
              multiline
            />
            <NavalButton
              title={t('wallet.setup.importButton')}
              onPress={() => setSecretConfirmed(true)}
              disabled={!secretInput.trim()}
              style={styles.submitButton}
            />
            <NavalButton
              title={t('wallet.setup.back')}
              variant="secondary"
              size="small"
              onPress={resetFlow}
            />
          </View>
        </KeyboardAvoidingView>
      </GradientContainer>
    );
  }

  // Create or Import (after secret key entered): PIN flow via PinModal
  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'create' ? t('wallet.setup.createTitle') : t('wallet.setup.importTitle')}
          </Text>
          <View style={styles.divider} />
        </View>

        <PinModal
          key={pinStep}
          visible={true}
          title={pinStep === 'enter'
            ? t('wallet.setup.pinLabel')
            : t('wallet.setup.pinConfirmLabel')}
          error={pinError}
          onSubmit={handlePinSubmit}
          onCancel={resetFlow}
        />

        {error !== '' && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: COLORS.status.pvp,
    letterSpacing: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.headingLight,
    fontSize: 12,
    color: COLORS.text.secondary,
    letterSpacing: 4,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.status.pvp,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  actions: {
    gap: SPACING.md,
  },
  form: {
    gap: SPACING.sm,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    marginTop: SPACING.xs,
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
  secretInput: {
    fontSize: 13,
    fontFamily: FONTS.bodyLight,
    minHeight: 60,
  },
  errorText: {
    fontFamily: FONTS.bodyLight,
    fontSize: 12,
    color: COLORS.text.danger,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
});
