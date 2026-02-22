import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '../../shared/theme';

interface Props {
  visible: boolean;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}

export default function PinModal({ visible, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (visible) setPin('');
  }, [visible]);

  const handleSubmit = () => {
    if (pin.length >= 4) onSubmit(pin);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('wallet.pin.title')}</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder={t('wallet.pin.placeholder')}
            placeholderTextColor={COLORS.text.secondary}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            autoFocus
            onSubmitEditing={handleSubmit}
          />
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{t('wallet.pin.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.confirmBtn, pin.length < 4 && styles.disabledBtn]}
              disabled={pin.length < 4}
            >
              <Text style={[styles.confirmText, pin.length < 4 && styles.disabledText]}>
                {t('wallet.pin.confirm')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.background.dark,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.status.pvp,
    letterSpacing: 2,
    textAlign: 'center',
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: 24,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.surface.cardBorder,
    textAlign: 'center',
    letterSpacing: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.status.pvp,
    backgroundColor: COLORS.ui.buttonBg,
    alignItems: 'center',
  },
  disabledBtn: {
    borderColor: COLORS.ui.disabledBorder,
    backgroundColor: COLORS.ui.disabledBg,
  },
  confirmText: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.status.pvp,
    letterSpacing: 1,
  },
  disabledText: {
    color: COLORS.text.secondary,
  },
});
