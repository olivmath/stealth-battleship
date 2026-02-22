import React from 'react';
import { NavalText } from '../UI/NavalText';
import { COLORS, SPACING, RADIUS } from '../../shared/theme';
import type { ShipDefinition, PlacedShip } from '../../shared/entities';

interface ShipSelectorProps {
  ships: ShipDefinition[];
  placedShips?: PlacedShip[];
  placedShipIds?: string[];
  selectedId?: string | null;
  selectedShipId?: string | null;
  onSelect: (ship: ShipDefinition) => void;
}

export function ShipSelector({ ships, placedShips, placedShipIds, selectedId, selectedShipId, onSelect }: ShipSelectorProps) {
  const placedIds = new Set(placedShipIds ?? placedShips?.map(s => s.id) ?? []);
  const activeSelectedId = selectedShipId ?? selectedId ?? null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.xs, justifyContent: 'center' }}>
      {ships.map(ship => {
        const placed = placedIds.has(ship.id);
        const selected = ship.id === activeSelectedId;
        return (
          <button key={ship.id} onClick={() => !placed && onSelect(ship)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: `6px ${SPACING.sm}px`,
              borderRadius: RADIUS.sharp,
              border: `1px solid ${selected ? COLORS.accent.gold : placed ? COLORS.surface.cardBorder : COLORS.surface.elevated}`,
              backgroundColor: selected ? COLORS.overlay.goldGlow : placed ? COLORS.surface.subtle : COLORS.surface.card,
              opacity: placed ? 0.4 : 1,
              cursor: placed ? 'default' : 'pointer',
            }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: ship.size }).map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: 1, backgroundColor: selected ? COLORS.accent.gold : COLORS.grid.ship }} />
              ))}
            </div>
            <NavalText variant="caption" color={placed ? COLORS.text.secondary : selected ? COLORS.accent.gold : COLORS.text.primary}>
              {ship.name}
            </NavalText>
          </button>
        );
      })}
    </div>
  );
}
