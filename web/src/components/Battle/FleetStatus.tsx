import React from 'react';
import { NavalText } from '../UI/NavalText';
import { COLORS, SPACING, RADIUS } from '../../shared/theme';
import type { PlacedShip } from '../../shared/entities';

interface FleetStatusProps {
  ships: PlacedShip[];
  compact?: boolean;
  label?: string;
}

export function FleetStatus({ ships, compact, label }: FleetStatusProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.xs, justifyContent: 'center' }}>
      {ships.map(ship => (
        <div key={ship.id} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: `2px ${SPACING.sm}px`,
          borderRadius: RADIUS.sharp,
          backgroundColor: ship.isSunk ? COLORS.overlay.fireGlow : COLORS.surface.subtle,
          borderLeft: `2px solid ${ship.isSunk ? COLORS.accent.fire : COLORS.accent.gold}`,
          opacity: ship.isSunk ? 0.5 : 1,
        }}>
          <NavalText variant="caption" color={ship.isSunk ? COLORS.accent.fire : COLORS.text.primary}
            style={{ textDecoration: ship.isSunk ? 'line-through' : 'none' }}>
            {compact ? ship.name.slice(0, 3).toUpperCase() : ship.name}
          </NavalText>
          {!compact && (
            <div style={{ display: 'flex', gap: 1 }}>
              {Array.from({ length: ship.size }).map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: 1,
                  backgroundColor: i < ship.hits ? COLORS.accent.fire : COLORS.grid.ship,
                }} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
