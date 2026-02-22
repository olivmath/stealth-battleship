import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../shared/theme';

interface Props {
  visible: boolean;
  pinLength?: number;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}

export default function PinModal({ visible, pinLength = 4, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const submitted = useRef(false);

  useEffect(() => {
    if (visible) {
      setPin('');
      submitted.current = false;
    }
  }, [visible]);

  // Auto-submit when PIN reaches target length
  useEffect(() => {
    if (pin.length >= pinLength && !submitted.current) {
      submitted.current = true;
      onSubmit(pin);
    }
  }, [pin, pinLength, onSubmit]);

  const handleChange = (text: string) => {
    // Only digits
    const digits = text.replace(/\D/g, '');
    setPin(digits);
  };

  // Visual dots
  const dots = Array.from({ length: pinLength }, (_, i) => (
    <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
  ));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('wallet.pin.title')}</Text>
          <View style={styles.dotsRow}>{dots}</View>
          <TextInput
            style={styles.hiddenInput}
            value={pin}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={pinLength}
            autoFocus
            caretHidden
          />
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>{t('wallet.pin.cancel')}</Text>
          </TouchableOpacity>
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
    borderRadius: RADIUS.default,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    padding: SPACING.lg,
    gap: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.status.pvp,
    letterSpacing: 2,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.grid.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: COLORS.status.pvp,
    borderColor: COLORS.status.pvp,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  cancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.default,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
  },
  cancelText: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
});
