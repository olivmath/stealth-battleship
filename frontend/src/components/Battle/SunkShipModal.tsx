import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Modal } from 'react-native';
import { PlacedShip } from '../../types/game';
import { getShipStyle } from '../../constants/game';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface Props {
  visible: boolean;
  ship: PlacedShip | null;
}

export default function SunkShipModal({ visible, ship }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const shipStyle = ship ? getShipStyle(ship.id) : null;
  const shipColor = shipStyle?.color ?? COLORS.grid.ship;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      rotate.setValue(0);
      opacity.setValue(1);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -20,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 200,
            duration: 1000,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotate, {
          toValue: 15,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible, translateY, rotate, opacity]);

  const rotateInterpolation = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible || !ship) return null;

  return (
    <Modal transparent visible={visible} animationType="none" accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { translateY },
                { rotate: rotateInterpolation },
              ],
              opacity,
            },
          ]}
          accessibilityRole="alert"
          accessibilityLabel={`Ship sunk! ${ship?.name ?? 'Unknown'} destroyed`}
        >
          <Text style={[styles.label, { color: shipColor }]}>SHIP SUNK!</Text>
          <Text style={styles.shipName}>{ship.name}</Text>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
