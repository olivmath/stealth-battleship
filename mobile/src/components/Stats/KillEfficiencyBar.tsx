import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShipKillEfficiency } from '../../shared/entities';
import { COLORS, FONTS } from '../../shared/theme';

interface Props {
  item: ShipKillEfficiency;
  showLegend?: boolean;
}

export default function KillEfficiencyBar({ item, showLegend = true }: Props) {
  const { t } = useTranslation();
  const maxShots = Math.max(item.actualShots, item.idealShots);
  const idealWidth = maxShots > 0 ? (item.idealShots / maxShots) * 100 : 0;
  const actualWidth = maxShots > 0 ? (item.actualShots / maxShots) * 100 : 0;
  const isPerfect = item.actualShots === item.idealShots;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.shipName}>{item.shipName}</Text>
        <Text style={[styles.ratio, isPerfect && styles.perfectRatio]}>
          {item.idealShots}/{item.actualShots} {isPerfect ? 'PERFECT' : ''}
        </Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barActual, { width: `${actualWidth}%` }]} />
        <View style={[styles.barIdeal, { width: `${idealWidth}%` }]} />
      </View>
      {showLegend && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.accent.gold }]} />
            <Text style={styles.legendText}>{t('stats.ideal', 'Ideal')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.accent.fire }]} />
            <Text style={styles.legendText}>{t('stats.actual', 'Actual')}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shipName: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.text.primary },
  ratio: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.text.secondary },
  perfectRatio: { color: COLORS.accent.gold },
  barBg: { height: 8, borderRadius: 4, backgroundColor: COLORS.surface.cardBorder, overflow: 'hidden' },
  barActual: { position: 'absolute', height: '100%', borderRadius: 4, backgroundColor: COLORS.accent.fire, opacity: 0.6 },
  barIdeal: { position: 'absolute', height: '100%', borderRadius: 4, backgroundColor: COLORS.accent.gold },
  legend: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontFamily: FONTS.bodyLight, fontSize: 10, color: COLORS.text.secondary },
});
