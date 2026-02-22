import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import { useHaptics } from '../src/hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../src/shared/theme';
import { createWallet, importWallet } from '../src/wallet/interactor';

type Mode = 'choose' | 'create' | 'import';

export default function WalletSetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const haptics = useHaptics();

  const [mode, setMode] = useState<Mode>('choose');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pinValid = pin.length >= 4 && pin.length <= 6 && /^\d+$/.test(pin);
  const pinsMatch = pin === pinConfirm;

  const handleCreate = async () => {
    if (!pinValid || !pinsMatch) return;
    setLoading(true);
    setError('');
    try {
      await createWallet(pin);
      haptics.success();
      router.replace('/menu');
    } catch (e: any) {
      setError(e.message || t('wallet.setup.errorGeneric'));
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!pinValid || !pinsMatch || !secretInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      await importWallet(secretInput, pin);
      haptics.success();
      router.replace('/menu');
    } catch (e: any) {
      setError(t('wallet.setup.errorInvalidKey'));
      setLoading(false);
    }
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

  return (
    <GradientContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'create' ? t('wallet.setup.createTitle') : t('wallet.setup.importTitle')}
          </Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.form}>
          {mode === 'import' && (
            <>
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
            </>
          )}

          <Text style={styles.label}>{t('wallet.setup.pinLabel')}</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder={t('wallet.setup.pinPlaceholder')}
            placeholderTextColor={COLORS.text.secondary}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />

          <Text style={styles.label}>{t('wallet.setup.pinConfirmLabel')}</Text>
          <TextInput
            style={styles.input}
            value={pinConfirm}
            onChangeText={setPinConfirm}
            placeholder={t('wallet.setup.pinConfirmPlaceholder')}
            placeholderTextColor={COLORS.text.secondary}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />

          {pin.length > 0 && !pinValid && (
            <Text style={styles.errorText}>{t('wallet.setup.pinInvalid')}</Text>
          )}
          {pinConfirm.length > 0 && !pinsMatch && (
            <Text style={styles.errorText}>{t('wallet.setup.pinMismatch')}</Text>
          )}
          {error !== '' && <Text style={styles.errorText}>{error}</Text>}

          <NavalButton
            title={mode === 'create' ? t('wallet.setup.createButton') : t('wallet.setup.importButton')}
            onPress={mode === 'create' ? handleCreate : handleImport}
            disabled={!pinValid || !pinsMatch || (mode === 'import' && !secretInput.trim())}
            style={styles.submitButton}
          />
          <NavalButton
            title={t('wallet.setup.back')}
            variant="secondary"
            size="small"
            onPress={() => { setMode('choose'); setPin(''); setPinConfirm(''); setSecretInput(''); setError(''); }}
          />
        </View>
      </KeyboardAvoidingView>
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
  },
  submitButton: {
    marginTop: SPACING.md,
  },
});
