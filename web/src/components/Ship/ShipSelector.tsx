import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShipDefinition } from '../../shared/entities';
import { COLORS, FONTS, SPACING, RADIUS } from '../../shared/theme';

interface Props {
  ships: ShipDefinition[];
  placedShipIds: string[];
  selectedShipId: string | null;
  onSelect: (ship: ShipDefinition) => void;
}

export function ShipSelector({ ships, placedShipIds, selectedShipId, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <div style={containerStyle}>
      <span style={titleStyle}>{t('placement.selectShipTitle')}</span>
      <div style={shipListStyle}>
        {ships.map(ship => {
          const isPlaced = placedShipIds.includes(ship.id);
          const isSelected = selectedShipId === ship.id;

          return (
            <button
              key={ship.id}
              style={{
                ...shipItemStyle,
                ...(isSelected ? selectedItemStyle : {}),
                ...(isPlaced ? placedItemStyle : {}),
              }}
              onClick={() => !isPlaced && onSelect(ship)}
              disabled={isPlaced}
              role="button"
              aria-label={`${t('ships.' + ship.name)}, size ${ship.size}${isPlaced ? ', placed' : isSelected ? ', selected' : ''}`}
              aria-disabled={isPlaced}
            >
              <div style={shipCellsStyle}>
                {Array.from({ length: ship.size }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      ...shipCellBaseStyle,
                      ...(isPlaced ? placedCellStyle : isSelected ? selectedCellStyle : defaultCellStyle),
                    }}
                  />
                ))}
              </div>
              <span style={{ ...shipNameStyle, ...(isPlaced ? placedTextStyle : {}) }}>
                {t('ships.' + ship.name)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  paddingLeft: SPACING.sm,
  paddingRight: SPACING.sm,
  paddingTop: SPACING.sm,
  paddingBottom: SPACING.sm,
};

const titleStyle: React.CSSProperties = {
  fontFamily: FONTS.heading,
  fontSize: 12,
  color: COLORS.text.secondary,
  letterSpacing: 2,
  marginBottom: SPACING.sm,
  display: 'block',
};

const shipListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: SPACING.xs,
};

const shipItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'flex-start',
  padding: SPACING.sm,
  minHeight: 44,
  borderRadius: RADIUS.default,
  border: `1px solid ${COLORS.grid.border}`,
  backgroundColor: COLORS.surface.card,
  cursor: 'pointer',
};

const selectedItemStyle: React.CSSProperties = {
  borderColor: COLORS.accent.gold,
  backgroundColor: COLORS.overlay.goldMedium,
};

const placedItemStyle: React.CSSProperties = {
  opacity: 0.4,
  cursor: 'default',
};

const shipCellsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 2,
  marginRight: SPACING.sm,
};

const shipCellBaseStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  boxSizing: 'border-box',
};

const defaultCellStyle: React.CSSProperties = {
  backgroundColor: COLORS.grid.ship,
  border: `1px solid ${COLORS.grid.border}`,
};

const selectedCellStyle: React.CSSProperties = {
  backgroundColor: COLORS.accent.gold,
  border: `1px solid ${COLORS.accent.goldDark}`,
};

const placedCellStyle: React.CSSProperties = {
  backgroundColor: COLORS.text.secondary,
  border: `1px solid ${COLORS.grid.border}`,
};

const shipNameStyle: React.CSSProperties = {
  fontFamily: FONTS.body,
  fontSize: 14,
  color: COLORS.text.primary,
};

const placedTextStyle: React.CSSProperties = {
  color: COLORS.text.secondary,
};
