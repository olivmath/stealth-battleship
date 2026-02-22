import React from 'react';
import { NavalText } from '../UI/NavalText';
import { COLORS, SPACING } from '../../shared/theme';

interface ShipShapeProps {
  name?: string;
  label?: string;
  size?: number;
  length?: number;
  color?: string;
}

export function ShipShape({ name: nameProp, label, size: sizeProp, length, color = COLORS.grid.ship }: ShipShapeProps) {
  const name = nameProp ?? label ?? '';
  const size = sizeProp ?? length ?? 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: size }).map((_, i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: 2, backgroundColor: color }} />
        ))}
      </div>
      <NavalText variant="caption" color={COLORS.text.secondary}>{name} ({size})</NavalText>
    </div>
  );
}
