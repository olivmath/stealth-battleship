import React from 'react';
import { NavalText } from '../UI/NavalText';
import { COLORS, SPACING, RADIUS } from '../../shared/theme';

interface KillEfficiencyBarProps {
  shipName?: string;
  idealShots?: number;
  actualShots?: number;
  item?: { shipName: string; idealShots: number; actualShots: number; [key: string]: any };
  showLegend?: boolean;
}

export function KillEfficiencyBar(props: KillEfficiencyBarProps) {
  const shipName = props.shipName ?? props.item?.shipName ?? '';
  const idealShots = props.idealShots ?? props.item?.idealShots ?? 1;
  const actualShots = props.actualShots ?? props.item?.actualShots ?? 1;
  return <KillEfficiencyBarInner shipName={shipName} idealShots={idealShots} actualShots={actualShots} />;
}

function KillEfficiencyBarInner({ shipName, idealShots, actualShots }: { shipName: string; idealShots: number; actualShots: number }) {
  const maxWidth = Math.max(idealShots, actualShots);
  const idealPct = (idealShots / maxWidth) * 100;
  const actualPct = (actualShots / maxWidth) * 100;

  return (
    <div style={{ marginBottom: SPACING.sm }}>
      <NavalText variant="caption" color={COLORS.text.secondary}>{shipName}</NavalText>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
        <div style={{ height: 6, borderRadius: RADIUS.pill, backgroundColor: COLORS.surface.subtle, overflow: 'hidden' }}>
          <div style={{ width: `${idealPct}%`, height: '100%', backgroundColor: COLORS.accent.gold, borderRadius: RADIUS.pill }} />
        </div>
        <div style={{ height: 6, borderRadius: RADIUS.pill, backgroundColor: COLORS.surface.subtle, overflow: 'hidden' }}>
          <div style={{ width: `${actualPct}%`, height: '100%', backgroundColor: actualShots <= idealShots ? COLORS.accent.victory : COLORS.accent.fire, borderRadius: RADIUS.pill }} />
        </div>
      </div>
    </div>
  );
}
