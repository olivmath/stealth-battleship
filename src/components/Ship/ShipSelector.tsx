import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShipDefinition } from '../../types/game';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface Props {
  ships: ShipDefinition[];
  placedShipIds: string[];
  selectedShipId: string | null;
  onSelect: (ship: ShipDefinition) => void;
}

export default function ShipSelector({ ships, placedShipIds, selectedShipId, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SELECT SHIP</Text>
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
                {ship.name}
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
    padding: SPACING.md,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  shipList: {
    gap: SPACING.sm,
  },
  shipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
  },
  selectedItem: {
    borderColor: COLORS.accent.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
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
