import React from 'react';
import { useTranslation } from 'react-i18next';
import { BattleTracking } from '../../shared/entities';
import { COLORS, FONTS, RADIUS } from '../../shared/theme';

interface Props {
  tracking: BattleTracking;
}

export function BattleStats({ tracking }: Props) {
  const { t } = useTranslation();
  const shots = tracking.playerShots.length;
  const hits = tracking.playerShots.filter(s => s.result === 'hit' || s.result === 'sunk').length;
  const misses = shots - hits;
  const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0;

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>STATS</span>
      <div style={rowsStyle}>
        <StatRow name="Shots" value={String(shots)} />
        <StatRow name="Hits" value={String(hits)} color={COLORS.accent.fire} />
        <StatRow name="Miss" value={String(misses)} />
        <StatRow name="Accuracy" value={`${accuracy}%`} color={COLORS.accent.gold} />
        <StatRow name="Streak" value={String(tracking.currentStreak)} />
      </div>
    </div>
  );
}

function StatRow({ name, value, color }: { name: string; value: string; color?: string }) {
  return (
    <div style={statRowStyle}>
      <span style={{ ...statValueStyle, ...(color ? { color } : {}) }}>{value}</span>
      <span style={statNameStyle}>{name}</span>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  padding: 4,
  borderRadius: RADIUS.default,
  border: `1px solid ${COLORS.grid.border}`,
  backgroundColor: COLORS.surface.card,
};

const labelStyle: React.CSSProperties = {
  fontFamily: FONTS.heading,
  fontSize: 10,
  color: COLORS.text.secondary,
  letterSpacing: 1,
  marginBottom: 2,
  display: 'block',
};

const rowsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const statRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 12,
};

const statNameStyle: React.CSSProperties = {
  fontFamily: FONTS.body,
  fontSize: 10,
  color: COLORS.text.primary,
  textAlign: 'right',
  flex: 1,
};

const statValueStyle: React.CSSProperties = {
  fontFamily: FONTS.body,
  fontSize: 10,
  color: COLORS.text.primary,
};
