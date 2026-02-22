import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlacedShip } from '../../shared/entities';
import { COLORS, FONTS, SPACING, RADIUS } from '../../shared/theme';

interface Props {
  ships: PlacedShip[];
  label: string;
  compact?: boolean;
}

export function FleetStatus({ ships, label, compact = false }: Props) {
  const { t } = useTranslation();
  const alive = ships.filter(s => !s.isSunk).length;
  const total = ships.length;

  if (compact) {
    return (
      <div style={compactContainerStyle}>
        <span style={compactLabelStyle}>
          {label} {alive}/{total}
        </span>
        <div style={compactShipsStyle}>
          {ships.map(ship => (
            <div
              key={ship.id}
              style={compactShipRowStyle}
              aria-label={ship.isSunk ? `${t('ships.' + ship.name)}: sunk` : `${t('ships.' + ship.name)}: ${ship.hits} of ${ship.size} hits`}
            >
              <div style={compactShipCellsStyle}>
                {Array.from({ length: ship.size }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      ...compactCellStyle,
                      ...(ship.isSunk ? sunkCellStyle : i < ship.hits ? hitCellStyle : aliveCellStyle),
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  ...compactShipNameStyle,
                  ...(ship.isSunk ? sunkTextStyle : {}),
                }}
              >
                {t('ships.' + ship.name)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>{label}</span>
      <div style={shipsStyle}>
        {ships.map(ship => (
          <div
            key={ship.id}
            style={shipRowStyle}
            aria-label={ship.isSunk ? `${t('ships.' + ship.name)}: sunk` : `${t('ships.' + ship.name)}: ${ship.hits} of ${ship.size} hits`}
          >
            <div style={shipCellsStyle}>
              {Array.from({ length: ship.size }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...cellStyle,
                    ...(ship.isSunk ? sunkCellStyle : i < ship.hits ? hitCellStyle : aliveCellStyle),
                  }}
                />
              ))}
            </div>
            <span style={{ ...shipNameStyle, ...(ship.isSunk ? sunkTextStyle : {}) }}>
              {t('ships.' + ship.name)}
            </span>
          </div>
        ))}
      </div>
      <span
        style={countStyle}
        aria-label={`${alive} of ${total} ships remaining`}
      >
        {alive}/{total}
      </span>
    </div>
  );
}

// --- Expanded styles ---

const containerStyle: React.CSSProperties = {
  padding: SPACING.sm,
  borderRadius: RADIUS.default,
  border: `1px solid ${COLORS.grid.border}`,
  backgroundColor: COLORS.surface.card,
};

const labelStyle: React.CSSProperties = {
  fontFamily: FONTS.heading,
  fontSize: 10,
  color: COLORS.text.secondary,
  letterSpacing: 2,
  marginBottom: SPACING.xs,
  display: 'block',
};

const shipsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const shipRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
};

const shipCellsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 2,
  marginRight: SPACING.sm,
};

const cellStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  boxSizing: 'border-box',
};

const aliveCellStyle: React.CSSProperties = {
  backgroundColor: COLORS.grid.ship,
  border: `1px solid ${COLORS.grid.border}`,
};

const hitCellStyle: React.CSSProperties = {
  backgroundColor: COLORS.accent.fire,
  border: `1px solid ${COLORS.accent.fireDark}`,
};

const sunkCellStyle: React.CSSProperties = {
  backgroundColor: COLORS.cell.sunk,
  border: `1px solid ${COLORS.accent.fireDark}`,
};

const shipNameStyle: React.CSSProperties = {
  fontFamily: FONTS.bodyLight,
  fontSize: 11,
  color: COLORS.text.primary,
};

const sunkTextStyle: React.CSSProperties = {
  color: COLORS.text.secondary,
  textDecoration: 'line-through',
};

const countStyle: React.CSSProperties = {
  fontFamily: FONTS.body,
  fontSize: 12,
  color: COLORS.text.accent,
  textAlign: 'right',
  marginTop: SPACING.xs,
  display: 'block',
};

// --- Compact styles ---

const compactContainerStyle: React.CSSProperties = {
  padding: 4,
  borderRadius: RADIUS.default,
  border: `1px solid ${COLORS.grid.border}`,
  backgroundColor: COLORS.surface.card,
};

const compactLabelStyle: React.CSSProperties = {
  fontFamily: FONTS.heading,
  fontSize: 10,
  color: COLORS.text.secondary,
  letterSpacing: 1,
  marginBottom: 2,
  display: 'block',
};

const compactShipsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const compactShipRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const compactShipCellsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 1,
};

const compactCellStyle: React.CSSProperties = {
  width: 7,
  height: 7,
  boxSizing: 'border-box',
};

const compactShipNameStyle: React.CSSProperties = {
  fontFamily: FONTS.body,
  fontSize: 10,
  color: COLORS.text.primary,
  textAlign: 'right',
  flex: 1,
};
