import React from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../shared/theme';

type Status = 'searching' | 'online' | 'ready' | 'offline';

interface Props {
  name: string;
  status: Status;
}

const STATUS_COLOR: Record<Status, string> = {
  searching: COLORS.status.waiting,
  online: COLORS.status.online,
  ready: COLORS.status.online,
  offline: COLORS.status.offline,
};

const STATUS_LABEL: Record<Status, string> = {
  searching: 'Searching...',
  online: 'Online',
  ready: 'Ready',
  offline: 'Offline',
};

export function OpponentStatus({ name, status }: Props) {
  const { t } = useTranslation();
  const dotColor = STATUS_COLOR[status];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.sm,
      borderRadius: 4,
      border: `1px solid ${COLORS.grid.border}`,
      backgroundColor: COLORS.surface.card,
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: dotColor,
        marginRight: SPACING.sm,
      }} />
      <span style={{
        fontFamily: FONTS.body,
        fontSize: FONT_SIZES.md,
        color: COLORS.text.primary,
        marginRight: SPACING.sm,
      }}>
        {name}
      </span>
      <span style={{
        fontFamily: FONTS.bodyLight,
        fontSize: 12,
        color: COLORS.text.secondary,
      }}>
        {STATUS_LABEL[status]}
      </span>
    </div>
  );
}
