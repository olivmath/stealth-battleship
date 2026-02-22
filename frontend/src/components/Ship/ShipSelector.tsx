import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShipDefinition } from '../../shared/entities';
import { COLORS, FONTS, SPACING, RADIUS } from '../../shared/theme';

interface Props {
  ships: ShipDefinition[];
  placedShipIds: string[];
  selectedShipId: string | null;
  onSelect: (ship: ShipDefinition) => void;
}

export default function ShipSelector({ ships, placedShipIds, selectedShipId, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('placement.selectShipTitle')}</Text>
      <View style={styles.shipList}>
        {ships.map(ship => {
          const isPlaced = placedShipIds.includes(ship.id);
          const isSelected = selectedShipId === ship.id;

          return (
            <TouchableOpacity
              key={ship.id}
              style={[
                styles.shipItem,
                isSelected && styles.selectedItem,
                isPlaced && styles.placedItem,
              ]}
              onPress={() => !isPlaced && onSelect(ship)}
              disabled={isPlaced}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${t('ships.' + ship.name)}, size ${ship.size}${isPlaced ? ', placed' : isSelected ? ', selected' : ''}`}
              accessibilityState={{ disabled: isPlaced, selected: isSelected }}
            >
              <View style={styles.shipCells}>
                {Array.from({ length: ship.size }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.shipCell,
                      isPlaced && styles.placedCell,
                      isSelected && styles.selectedCell,
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.shipName, isPlaced && styles.placedText]}>
                {t('ships.' + ship.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  shipList: {
    gap: SPACING.xs,
  },
  shipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: SPACING.sm,
    minHeight: 44,
    borderRadius: RADIUS.default,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    backgroundColor: COLORS.surface.card,
  },
  selectedItem: {
    borderColor: COLORS.accent.gold,
    backgroundColor: COLORS.overlay.goldMedium,
  },
  placedItem: {
    opacity: 0.4,
  },
  shipCells: {
    flexDirection: 'row',
    gap: 2,
    marginRight: SPACING.sm,
  },
  shipCell: {
    width: 16,
    height: 16,
    backgroundColor: COLORS.grid.ship,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
  },
  selectedCell: {
    backgroundColor: COLORS.accent.gold,
    borderColor: COLORS.accent.goldDark,
  },
  placedCell: {
    backgroundColor: COLORS.text.secondary,
  },
  shipName: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  placedText: {
    color: COLORS.text.secondary,
  },
});
