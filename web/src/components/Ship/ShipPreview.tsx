import React from 'react';
import { NavalText } from '../UI/NavalText';
import { NavalButton } from '../UI/NavalButton';
import { COLORS, SPACING } from '../../shared/theme';
import type { Orientation } from '../../shared/entities';

interface ShipPreviewProps {
  orientation: Orientation;
  onToggle: () => void;
  shipSize?: number;
}

export function ShipPreview({ orientation, onToggle }: ShipPreviewProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
      <NavalText variant="caption" color={COLORS.text.secondary}>
        {orientation === 'horizontal' ? 'H' : 'V'}
      </NavalText>
      <NavalButton title="Rotate (R)" onPress={onToggle} variant="ghost" size="sm" />
    </div>
  );
}
