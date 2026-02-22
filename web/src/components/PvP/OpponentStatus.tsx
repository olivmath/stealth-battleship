import React from 'react';
import { NavalText } from '../UI/NavalText';
import { COLORS, SPACING, RADIUS } from '../../shared/theme';

type Status = 'searching' | 'online' | 'ready' | 'offline';

interface OpponentStatusProps {
  name: string;
  status: Status;
}

const statusColors: Record<Status, string> = {
  searching: COLORS.status.waiting,
  online: COLORS.status.online,
  ready: COLORS.status.pvp,
  offline: COLORS.status.offline,
};

export function OpponentStatus({ name, status }: OpponentStatusProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: SPACING.sm,
      padding: `${SPACING.xs}px ${SPACING.md}px`,
      backgroundColor: COLORS.surface.card,
      borderRadius: RADIUS.md,
      border: `1px solid ${COLORS.surface.cardBorder}`,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColors[status] }} />
      <NavalText variant="body" color={COLORS.text.primary}>{name}</NavalText>
      <NavalText variant="caption" color={statusColors[status]}>{status.toUpperCase()}</NavalText>
    </div>
  );
}
