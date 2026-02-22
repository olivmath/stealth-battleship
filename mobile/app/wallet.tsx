import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useHaptics } from '../src/hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../src/shared/theme';
import { getPublicKey, getSecretKey, getBalance } from '../src/wallet/interactor';
import PinModal from '../src/components/UI/PinModal';

export default function WalletScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const haptics = useHaptics();

  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [copied, setCopied] = useState<'address' | 'secret' | null>(null);

  useEffect(() => {
    getPublicKey().then(pk => {
      if (pk) {
        setPublicKey(pk);
        getBalance(pk).then(setBalance);
      }
    });
  }, []);

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(publicKey);
    haptics.light();
    setCopied('address');
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePinSuccess = async (pin: string) => {
    try {
      setPinError(false);
      const secret = await getSecretKey(pin);
      setShowPin(false);
      setSecretKey(secret);
      haptics.success();
      setTimeout(() => setSecretKey(null), 30000);
    } catch {
      haptics.error();
      setPinError(true);
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
            <View style={[styles.copyBadge, copied === 'address' && styles.copyBadgeCopied]}>
              <Text style={[styles.copyBadgeText, copied === 'address' && styles.copyBadgeTextCopied]}>
                {copied === 'address' ? t('wallet.view.copied') : t('wallet.view.tapToCopy')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Balance */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>{t('wallet.view.balance')}</Text>
            <Text style={styles.balanceValue}>
              {balance !== null ? `${parseFloat(balance).toFixed(2)} XLM` : '—'}
            </Text>
            <Text style={styles.balanceNetwork}>TESTNET</Text>
          </View>
        </View>

        {/* Secret Key (shown temporarily after PIN) */}
        {secretKey && (
          <View style={styles.secretBox}>
            <View style={styles.secretHeader}>
              <Text style={styles.label}>{t('wallet.view.secretLabel')}</Text>
              <TouchableOpacity
                onPress={async () => {
                  await Clipboard.setStringAsync(secretKey);
                  haptics.success();
                  setCopied('secret');
                  setTimeout(() => setCopied(null), 3000);
                }}
                style={[styles.copyBtn, copied === 'secret' && styles.copyBtnCopied]}
              >
                <Text style={[styles.copyBtnText, copied === 'secret' && styles.copyBtnTextCopied]}>
                  {copied === 'secret' ? t('wallet.view.copied') : t('wallet.view.copyBtn')}
                </Text>
              </TouchableOpacity>
            </View>
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
            onPress={() => { haptics.light(); setShowPin(true); }}
          />
          <NavalButton
            title={t('wallet.view.back')}
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>

        <PinModal
          visible={showPin}
          title={t('wallet.view.enterPin', 'Enter PIN')}
          error={pinError}
          onSubmit={handlePinSuccess}
          onCancel={() => { setShowPin(false); setPinError(false); }}
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
    gap: SPACING.xs,
  },
  addressText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  copyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
  },
  copyBadgeCopied: {
    borderColor: COLORS.status.online,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  copyBadgeText: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  copyBadgeTextCopied: {
    color: COLORS.status.online,
  },
  balanceRow: {
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: 2,
  },
  balanceLabel: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  balanceValue: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.text.accent,
    letterSpacing: 1,
  },
  balanceNetwork: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    color: COLORS.status.pvp,
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: COLORS.status.pvp,
    borderRadius: 4,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    opacity: 0.7,
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
  secretHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.accent.fire,
  },
  copyBtnCopied: {
    borderColor: COLORS.status.online,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  copyBtnText: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    color: COLORS.accent.fire,
    letterSpacing: 1,
  },
  copyBtnTextCopied: {
    color: COLORS.status.online,
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
});
