import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BattleTracking } from '../../types/game';
import { COLORS, FONTS } from '../../constants/theme';

interface Props {
  tracking: BattleTracking;
}

export default function BattleStats({ tracking }: Props) {
  const shots = tracking.playerShots.length;
  const hits = tracking.playerShots.filter(s => s.result === 'hit' || s.result === 'sunk').length;
  const misses = shots - hits;
  const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>STATS</Text>
      <View style={styles.rows}>
        <StatRow name="Shots" value={String(shots)} />
        <StatRow name="Hits" value={String(hits)} color={COLORS.accent.fire} />
        <StatRow name="Miss" value={String(misses)} />
        <StatRow name="Accuracy" value={`${accuracy}%`} color={COLORS.accent.gold} />
        <StatRow name="Streak" value={String(tracking.currentStreak)} />
      </View>
    </View>
  );
}

function StatRow({ name, value, color }: { name: string; value: string; color?: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statValue, color ? { color } : undefined]}>{value}</Text>
      <Text style={styles.statName}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  rows: {
    gap: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statName: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.text.primary,
    textAlign: 'right',
    flex: 1,
  },
  statValue: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.text.primary,
  },
});
