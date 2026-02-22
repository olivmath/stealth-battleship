import React from 'react';
import { NavalText } from '../UI/NavalText';
import { COLORS, SPACING } from '../../shared/theme';
import type { BattleTracking } from '../../shared/entities';

interface BattleStatsProps {
  shots?: number;
  hits?: number;
  misses?: number;
  streak?: number;
  tracking?: BattleTracking;
}

export function BattleStats(props: BattleStatsProps) {
  const shots = props.shots ?? (props.tracking ? props.tracking.playerShots.length : 0);
  const hits = props.hits ?? (props.tracking ? props.tracking.playerShots.filter(s => s.result !== 'miss').length : 0);
  const misses = props.misses ?? (shots - hits);
  const streak = props.streak ?? (props.tracking ? props.tracking.currentStreak : 0);
  return <BattleStatsInner shots={shots} hits={hits} misses={misses} streak={streak} />;
}

function BattleStatsInner({ shots, hits, misses, streak }: { shots: number; hits: number; misses: number; streak: number }) {
  const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', padding: `${SPACING.sm}px ${SPACING.md}px` }}>
      <StatItem label="SHOTS" value={shots} />
      <StatItem label="HITS" value={hits} color={COLORS.accent.fire} />
      <StatItem label="MISS" value={misses} />
      <StatItem label="ACC" value={`${accuracy}%`} color={COLORS.accent.gold} />
      <StatItem label="STREAK" value={streak} color={streak > 0 ? COLORS.accent.victory : undefined} />
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <NavalText variant="caption" color={COLORS.text.secondary}>{label}</NavalText>
      <NavalText variant="body" color={color || COLORS.text.primary}>{String(value)}</NavalText>
    </div>
  );
}
