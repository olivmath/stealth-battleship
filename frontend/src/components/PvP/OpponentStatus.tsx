import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

type Status = 'searching' | 'online' | 'ready' | 'offline';

interface Props {
  name: string;
  status: Status;
}

const STATUS_COLOR: Record<Status, string> = {
  searching: '#eab308',
  online: '#22c55e',
  ready: '#22c55e',
  offline: '#6b7280',
};

const STATUS_LABEL: Record<Status, string> = {
  searching: 'Searching...',
  online: 'Online',
  ready: 'Ready',
  offline: 'Offline',
};

export default function OpponentStatus({ name, status }: Props) {
  const dotColor = STATUS_COLOR[status];

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.statusLabel}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    backgroundColor: 'rgba(30, 58, 95, 0.2)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  name: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
  },
  statusLabel: {
    fontFamily: FONTS.bodyLight,
    fontSize: 12,
    color: COLORS.text.secondary,
  },
});
