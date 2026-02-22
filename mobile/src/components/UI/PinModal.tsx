import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../shared/theme';

interface Props {
  visible: boolean;
  pinLength?: number;
  title?: string;
  error?: boolean;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}

export default function PinModal({ visible, pinLength = 4, title, error, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [shaking, setShaking] = useState(false);
  const submitted = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setPin('');
      setShaking(false);
      submitted.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  // Handle error: shake + red dots, then clear
  useEffect(() => {
    if (error) {
      setShaking(true);
      shakeX.value = withSequence(
        withTiming(-8, { duration: 60, easing: Easing.linear }),
        withTiming(7, { duration: 60, easing: Easing.linear }),
        withTiming(-6, { duration: 60, easing: Easing.linear }),
        withTiming(5, { duration: 60, easing: Easing.linear }),
        withTiming(-3, { duration: 60, easing: Easing.linear }),
        withTiming(2, { duration: 60, easing: Easing.linear }),
        withTiming(-1, { duration: 60, easing: Easing.linear }),
        withTiming(0, { duration: 80, easing: Easing.linear })
      );
      const timer = setTimeout(() => {
        setShaking(false);
        setPin('');
        submitted.current = false;
        setTimeout(() => inputRef.current?.focus(), 50);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Auto-submit when PIN reaches target length
  useEffect(() => {
    if (pin.length >= pinLength && !submitted.current) {
      submitted.current = true;
      onSubmit(pin);
    }
  }, [pin, pinLength, onSubmit]);

  const handleChange = (text: string) => {
    if (shaking) return;
    const digits = text.replace(/\D/g, '');
    setPin(digits);
  };

  const isError = shaking || error;
  const dotColor = isError ? COLORS.accent.fire : COLORS.status.pvp;
  const dotBorderInactive = isError ? COLORS.accent.fireDark : COLORS.grid.border;

  // Visual dots
  const dots = Array.from({ length: pinLength }, (_, i) => (
    <View
      key={i}
      style={[
        styles.dot,
        {
          borderColor: i < pin.length ? dotColor : dotBorderInactive,
          backgroundColor: i < pin.length ? dotColor : 'transparent',
        },
      ]}
    />
  ));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title ?? t('wallet.pin.title')}</Text>
          <Animated.View style={[styles.dotsRow, shakeStyle]}>
            {dots}
          </Animated.View>
          <TextInput
            ref={inputRef}
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
