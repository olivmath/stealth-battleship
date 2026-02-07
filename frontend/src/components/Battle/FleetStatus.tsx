import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlacedShip } from '../../types/game';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface Props {
  ships: PlacedShip[];
  label: string;
  compact?: boolean;
}

export default function FleetStatus({ ships, label, compact = false }: Props) {
  const alive = ships.filter(s => !s.isSunk).length;
  const total = ships.length;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactLabel}>
          {label} {alive}/{total}
        </Text>
        <View style={styles.compactShips}>
          {ships.map(ship => (
            <View
              key={ship.id}
              style={styles.compactShipRow}
              accessibilityLabel={ship.isSunk ? `${ship.name}: sunk` : `${ship.name}: ${ship.hits} of ${ship.size} hits`}
            >
              <View style={styles.compactShipCells}>
                {Array.from({ length: ship.size }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.compactCell,
                      ship.isSunk ? styles.sunkCell : i < ship.hits ? styles.hitCell : styles.aliveCell,
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[styles.compactShipName, ship.isSunk && styles.sunkText]}
                numberOfLines={1}
              >
                {ship.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.ships}>
        {ships.map(ship => (
          <View
            key={ship.id}
            style={styles.shipRow}
            accessibilityLabel={ship.isSunk ? `${ship.name}: sunk` : `${ship.name}: ${ship.hits} of ${ship.size} hits`}
          >
            <View style={styles.shipCells}>
              {Array.from({ length: ship.size }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.cell,
                    ship.isSunk ? styles.sunkCell : i < ship.hits ? styles.hitCell : styles.aliveCell,
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.shipName, ship.isSunk && styles.sunkText]}>
              {ship.name}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.count} accessibilityLabel={`${alive} of ${total} ships remaining`}>{alive}/{total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.sm,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  ships: {
    gap: 4,
  },
  shipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shipCells: {
    flexDirection: 'row',
    gap: 2,
    marginRight: SPACING.sm,
  },
  cell: {
    width: 10,
    height: 10,
    borderWidth: 1,
  },
  aliveCell: {
    backgroundColor: COLORS.grid.ship,
    borderColor: COLORS.grid.border,
  },
  hitCell: {
    backgroundColor: COLORS.accent.fire,
    borderColor: COLORS.accent.fireDark,
  },
  sunkCell: {
    backgroundColor: COLORS.cell.sunk,
    borderColor: COLORS.accent.fireDark,
  },
  shipName: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.primary,
  },
  sunkText: {
    color: COLORS.text.secondary,
    textDecorationLine: 'line-through',
  },
  count: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.text.accent,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  // Compact styles
  compactContainer: {
    alignSelf: 'flex-end',
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
  },
  compactLabel: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  compactShips: {
    gap: 2,
  },
  compactShipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactShipCells: {
    flexDirection: 'row',
    gap: 1,
    marginRight: 6,
  },
  compactCell: {
    width: 7,
    height: 7,
    borderWidth: 1,
  },
  compactShipName: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.primary,
    flexShrink: 1,
  },
});
