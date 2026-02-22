import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PlacedShip } from '../../shared/entities';
import { COLORS, FONTS, SPACING } from '../../shared/theme';

interface Props {
  ships: PlacedShip[];
  label: string;
  compact?: boolean;
}

export default function FleetStatus({ ships, label, compact = false }: Props) {
  const { t } = useTranslation();
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
              accessibilityLabel={ship.isSunk ? `${t('ships.' + ship.name)}: sunk` : `${t('ships.' + ship.name)}: ${ship.hits} of ${ship.size} hits`}
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
                {t('ships.' + ship.name)}
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
            accessibilityLabel={ship.isSunk ? `${t('ships.' + ship.name)}: sunk` : `${t('ships.' + ship.name)}: ${ship.hits} of ${ship.size} hits`}
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
              {t('ships.' + ship.name)}
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
    backgroundColor: COLORS.surface.card,
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
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    backgroundColor: COLORS.surface.card,
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
    justifyContent: 'space-between',
  },
  compactShipCells: {
    flexDirection: 'row',
    gap: 1,
  },
  compactCell: {
    width: 7,
    height: 7,
    borderWidth: 1,
  },
  compactShipName: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.text.primary,
    textAlign: 'right',
    flex: 1,
  },
});
