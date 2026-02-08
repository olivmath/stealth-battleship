import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { PlacedShip } from '../../types/game';
import { getShipStyle } from '../../constants/game';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface Props {
  visible: boolean;
  ship: PlacedShip | null;
  onDismiss?: () => void;
}

export default function SunkShipModal({ visible, ship, onDismiss }: Props) {
  const { t } = useTranslation();
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const shipStyle = ship ? getShipStyle(ship.id) : null;
  const shipColor = shipStyle?.color ?? COLORS.grid.ship;

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      rotate.value = 0;
      opacity.value = 1;

      translateY.value = withSequence(
        withTiming(-20, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(200, { duration: 1000, easing: Easing.in(Easing.quad) })
      );

      rotate.value = withTiming(15, {
        duration: 1200,
        easing: Easing.inOut(Easing.quad),
      });

      opacity.value = withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 400 })
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
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
          <Text style={styles.shipName}>{t('ships.' + ship.name)}</Text>
          <View style={styles.shipGraphic}>
            {Array.from({ length: ship.size }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.shipCell,
                  { backgroundColor: shipColor, borderColor: shipColor },
                ]}
              />
            ))}
          </View>
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
  shipName: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: COLORS.text.primary,
    letterSpacing: 2,
  },
  shipGraphic: {
    flexDirection: 'row',
    gap: 4,
  },
  shipCell: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
  },
});
