import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlacedShip } from '../../shared/entities';
import { COLORS, FONTS, SPACING } from '../../shared/theme';

interface Props {
  ships: PlacedShip[];
  label: string;
  mirrored?: boolean;
}

/**
 * Hull Integrity Gauge — segmented health bar where each segment = one ship cell.
 * Ships are visually separated by thin gaps. Damaged cells glow fire-red,
 * sunk ships dim to charcoal. A scan-line sweeps across the bar.
 */
export function HealthBar({ ships, label, mirrored = false }: Props) {
  const { t } = useTranslation();
  const totalCells = ships.reduce((sum, s) => sum + s.size, 0);
  const hitCells = ships.reduce((sum, s) => sum + s.hits, 0);
  const alive = totalCells - hitCells;
  const pct = totalCells > 0 ? (alive / totalCells) * 100 : 0;

  // Status color based on fleet health
  const statusColor = pct > 60
    ? COLORS.accent.gold
    : pct > 25
      ? '#eab308'
      : COLORS.accent.fire;

  const statusGlow = pct > 60
    ? COLORS.overlay.goldMedium
    : pct > 25
      ? 'rgba(234, 179, 8, 0.1)'
      : COLORS.overlay.fireGlow;

  return (
    <div style={{
      display: 'flex',
      flexDirection: mirrored ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      width: '100%',
    }}>
      {/* Label */}
      <span style={{
        fontFamily: FONTS.heading,
        fontSize: 8,
        color: COLORS.text.secondary,
        letterSpacing: 2.5,
        whiteSpace: 'nowrap',
        minWidth: 56,
        textAlign: mirrored ? 'right' : 'left',
        textTransform: 'uppercase' as const,
      }}>
        {label}
      </span>

      {/* Segmented gauge */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 3, // gap between ships
        height: 14,
        padding: '2px 4px',
        borderRadius: 2,
        border: `1px solid ${COLORS.grid.border}`,
        backgroundColor: COLORS.surface.card,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Scan-line overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(30, 58, 95, 0.08) 2px,
            rgba(30, 58, 95, 0.08) 4px
          )`,
          pointerEvents: 'none',
          zIndex: 2,
        }} />

        {/* Sweep line animation */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 20,
          background: `linear-gradient(90deg, transparent, ${statusColor}12, transparent)`,
          animation: 'healthSweep 3s linear infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Ship segments */}
        {ships.map((ship, shipIdx) => (
          <div
            key={ship.id}
            style={{
              display: 'flex',
              gap: 1,
              flex: ship.size,
            }}
          >
            {Array.from({ length: ship.size }).map((_, cellIdx) => {
              const isHit = cellIdx < ship.hits;
              const isSunk = ship.isSunk;

              return (
                <div
                  key={cellIdx}
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 1,
                    transition: 'all 0.4s ease',
                    ...(isSunk ? {
                      backgroundColor: COLORS.cell.sunk,
                      opacity: 0.4,
                    } : isHit ? {
                      backgroundColor: COLORS.accent.fire,
                      boxShadow: `0 0 4px ${COLORS.accent.fire}80, inset 0 1px 0 rgba(255,255,255,0.15)`,
                    } : {
                      backgroundColor: statusColor,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1)`,
                      opacity: 0.9,
                    }),
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Counter */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 2,
        minWidth: 40,
        justifyContent: mirrored ? 'flex-start' : 'flex-end',
      }}>
        <span style={{
          fontFamily: FONTS.heading,
          fontSize: 13,
          color: statusColor,
          letterSpacing: 1,
          transition: 'color 0.4s ease',
          textShadow: `0 0 8px ${statusColor}40`,
        }}>
          {alive}
        </span>
        <span style={{
          fontFamily: FONTS.body,
          fontSize: 10,
          color: COLORS.text.secondary,
          opacity: 0.6,
        }}>
          /{totalCells}
        </span>
      </div>

      {/* Keyframes injected once */}
      <style>{`
        @keyframes healthSweep {
          0% { left: -20px; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
