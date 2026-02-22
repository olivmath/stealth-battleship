import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useHaptics } from '../src/hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../src/shared/theme';
import { getPublicKey, getSecretKey } from '../src/wallet/interactor';
import PinModal from '../src/components/UI/PinModal';

export default function WalletScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const haptics = useHaptics();

  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [pinAction, setPinAction] = useState<'view' | 'export'>('view');
  const [copied, setCopied] = useState<'address' | 'secret' | null>(null);

  useEffect(() => {
    getPublicKey().then(pk => {
      if (pk) setPublicKey(pk);
    });
  }, []);

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(publicKey);
    haptics.light();
    setCopied('address');
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePinSuccess = async (pin: string) => {
    setShowPin(false);
    try {
      const secret = await getSecretKey(pin);
      if (pinAction === 'export') {
        await Clipboard.setStringAsync(secret);
        haptics.success();
        setCopied('secret');
        setTimeout(() => setCopied(null), 3000);
      } else {
        setSecretKey(secret);
        haptics.success();
        // Hide after 30s
        setTimeout(() => setSecretKey(null), 30000);
      }
    } catch {
      Alert.alert(t('wallet.view.errorTitle'), t('wallet.view.errorInvalidPin'));
    }
  };

  const truncated = publicKey
    ? `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`
    : '';

  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('wallet.view.title')}</Text>
          <View style={styles.divider} />
        </View>

        {/* Public Address */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('wallet.view.addressLabel')}</Text>
          <View style={styles.qrContainer}>
            {publicKey !== '' && (
              <QRCode
                value={publicKey}
                size={160}
                backgroundColor="transparent"
                color={COLORS.text.primary}
              />
            )}
          </View>
          <TouchableOpacity onPress={handleCopyAddress} style={styles.addressRow}>
            <Text style={styles.addressText}>{truncated}</Text>
            <Text style={styles.copyHint}>
              {copied === 'address' ? t('wallet.view.copied') : t('wallet.view.tapToCopy')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Secret Key (shown temporarily after PIN) */}
        {secretKey && (
          <View style={styles.secretBox}>
            <Text style={styles.label}>{t('wallet.view.secretLabel')}</Text>
            <Text style={styles.secretText} selectable>{secretKey}</Text>
            <Text style={styles.secretWarning}>{t('wallet.view.secretWarning')}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <NavalButton
            title={t('wallet.view.viewSecret')}
            subtitle={t('wallet.view.viewSecretSub')}
            variant="pvp"
            onPress={() => { haptics.light(); setPinAction('view'); setShowPin(true); }}
          />
          <NavalButton
            title={t('wallet.view.exportSecret')}
            subtitle={t('wallet.view.exportSecretSub')}
            variant="danger"
            onPress={() => { haptics.light(); setPinAction('export'); setShowPin(true); }}
          />
          {copied === 'secret' && (
            <Text style={styles.copiedFeedback}>{t('wallet.view.secretCopied')}</Text>
          )}
          <NavalButton
            title={t('wallet.view.back')}
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>

        <PinModal
          visible={showPin}
          onSubmit={handlePinSuccess}
          onCancel={() => setShowPin(false)}
        />
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: COLORS.status.pvp,
    letterSpacing: 3,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.status.pvp,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  section: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  qrContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface.elevated,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
  },
  addressRow: {
    alignItems: 'center',
    gap: 2,
  },
  addressText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  copyHint: {
    fontFamily: FONTS.bodyLight,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  secretBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface.elevated,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.accent.fire,
    gap: SPACING.xs,
  },
  secretText: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.accent.fire,
    letterSpacing: 0.5,
  },
  secretWarning: {
    fontFamily: FONTS.bodyLight,
    fontSize: 10,
    color: COLORS.text.danger,
    opacity: 0.8,
  },
  actions: {
    marginTop: 'auto',
    gap: SPACING.md,
  },
  copiedFeedback: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.status.online,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
