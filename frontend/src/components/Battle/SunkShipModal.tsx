import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { PlacedShip } from '../../shared/entities';
import { getShipStyle, getShipSinkingGif } from '../../shared/constants';
import { COLORS, FONTS, SPACING } from '../../shared/theme';

interface Props {
  visible: boolean;
  ship: PlacedShip | null;
  onDismiss?: () => void;
}

export default function SunkShipModal({ visible, ship, onDismiss }: Props) {
  const { t } = useTranslation();
  const opacity = useSharedValue(0);

  const shipStyle = ship ? getShipStyle(ship.id) : null;
  const shipColor = shipStyle?.color ?? COLORS.grid.ship;
  const gif = ship ? getShipSinkingGif(ship.id) : null;

  useEffect(() => {
    if (visible) {
      opacity.value = 0;
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 400 })
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible || !ship) return null;

  return (
    <Modal transparent visible={visible} animationType="none" accessibilityViewIsModal>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          style={[styles.container, animatedStyle]}
          accessibilityRole="alert"
          accessibilityLabel={`Ship sunk! ${ship?.name ?? 'Unknown'} destroyed`}
        >
          <Text style={[styles.label, { color: shipColor }]}>{t('battle.shipSunk')}</Text>
          {gif && (
            <Image source={gif} style={styles.gif} resizeMode="contain" />
          )}
          <Text style={styles.shipName}>{t('ships.' + ship.name)}</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay.backdropLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    letterSpacing: 3,
  },
  gif: {
    width: 200,
    height: 200,
  },
  shipName: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: COLORS.text.primary,
    letterSpacing: 2,
  },
});
