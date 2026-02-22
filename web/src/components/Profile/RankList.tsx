import React from 'react';
import { NavalText } from '../UI/NavalText';
import { COLORS, SPACING, RADIUS } from '../../shared/theme';
import { RANKS } from '../../stats/interactor';

interface RankListProps {
  currentXP?: number;
  totalXP?: number;
}

export function RankList({ currentXP, totalXP }: RankListProps) {
  const xp = totalXP ?? currentXP ?? 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
      {RANKS.map((rank, i) => {
        const isCurrentOrPast = xp >= rank.xp;
        return (
          <div key={rank.rank} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: `${SPACING.xs}px ${SPACING.sm}px`,
            borderRadius: RADIUS.sharp,
            backgroundColor: isCurrentOrPast ? COLORS.overlay.goldGlow : 'transparent',
            borderLeft: `2px solid ${isCurrentOrPast ? COLORS.accent.gold : COLORS.surface.cardBorder}`,
          }}>
            <NavalText variant="caption" color={isCurrentOrPast ? COLORS.accent.gold : COLORS.text.secondary}>{rank.rank}</NavalText>
            <NavalText variant="caption" color={COLORS.text.secondary}>{rank.xp} XP</NavalText>
          </div>
        );
      })}
    </div>
  );
}
