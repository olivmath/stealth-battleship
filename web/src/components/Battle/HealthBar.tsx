import React from 'react';
import { PlacedShip } from '../../shared/entities';
import { COLORS, FONTS, SPACING } from '../../shared/theme';

interface Props {
  playerShips: PlacedShip[];
  opponentShips: PlacedShip[];
  playerLabel: string;
  opponentLabel: string;
}

function getStatusColor(pct: number) {
  if (pct > 60) return COLORS.accent.gold;
  if (pct > 25) return '#eab308';
  return COLORS.accent.fire;
}

function ShipSegments({ ships, reversed }: { ships: PlacedShip[]; reversed?: boolean }) {
  const totalCells = ships.reduce((sum, s) => sum + s.size, 0);
  const hitCells = ships.reduce((sum, s) => sum + s.hits, 0);
  const alive = totalCells - hitCells;
  const pct = totalCells > 0 ? (alive / totalCells) * 100 : 0;
  const statusColor = getStatusColor(pct);

  const orderedShips = reversed ? [...ships].reverse() : ships;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 3,
      height: 14,
      padding: '2px 4px',
      borderRadius: 2,
      border: `1px solid ${COLORS.grid.border}`,
      backgroundColor: COLORS.surface.card,
      position: 'relative',
      overflow: 'hidden',
      flexDirection: reversed ? 'row-reverse' : 'row',
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

      {/* Sweep line */}
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

      {orderedShips.map((ship) => (
        <div
          key={ship.id}
          style={{
            display: 'flex',
            gap: 1,
            flex: ship.size,
            flexDirection: reversed ? 'row-reverse' : 'row',
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
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                    opacity: 0.9,
                  }),
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Counter({ ships, align }: { ships: PlacedShip[]; align: 'left' | 'right' }) {
  const totalCells = ships.reduce((sum, s) => sum + s.size, 0);
  const hitCells = ships.reduce((sum, s) => sum + s.hits, 0);
  const alive = totalCells - hitCells;
  const pct = totalCells > 0 ? (alive / totalCells) * 100 : 0;
  const statusColor = getStatusColor(pct);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 2,
      minWidth: 36,
      justifyContent: align === 'left' ? 'flex-start' : 'flex-end',
    }}>
      <span style={{
        fontFamily: FONTS.heading,
        fontSize: 12,
        color: statusColor,
        letterSpacing: 1,
        transition: 'color 0.4s ease',
        textShadow: `0 0 8px ${statusColor}40`,
      }}>
        {alive}
      </span>
      <span style={{
        fontFamily: FONTS.body,
        fontSize: 9,
        color: COLORS.text.secondary,
        opacity: 0.6,
      }}>
        /{totalCells}
      </span>
    </div>
  );
}

/**
 * Dual health bar: ENEMY [████←  ][  →████] YOURS
 * Both bars shrink toward center. Enemy on left, player on right.
 */
export function HealthBarDual({ playerShips, opponentShips, playerLabel, opponentLabel }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      width: '100%',
    }}>
      {/* Enemy label */}
      <span style={{
        fontFamily: FONTS.heading,
        fontSize: 8,
        color: COLORS.text.secondary,
        letterSpacing: 2,
        whiteSpace: 'nowrap',
        textTransform: 'uppercase' as const,
      }}>
        {opponentLabel}
      </span>

      {/* Enemy counter */}
      <Counter ships={opponentShips} align="right" />

      {/* Enemy bar (reversed — shrinks toward center) */}
      <ShipSegments ships={opponentShips} reversed />

      {/* Center divider */}
      <div style={{
        width: 2,
        height: 18,
        backgroundColor: COLORS.grid.border,
        flexShrink: 0,
      }} />

      {/* Player bar (normal — shrinks toward center) */}
      <ShipSegments ships={playerShips} />

      {/* Player counter */}
      <Counter ships={playerShips} align="left" />

      {/* Player label */}
      <span style={{
        fontFamily: FONTS.heading,
        fontSize: 8,
        color: COLORS.text.secondary,
        letterSpacing: 2,
        whiteSpace: 'nowrap',
        textTransform: 'uppercase' as const,
      }}>
        {playerLabel}
      </span>

      <style>{`
        @keyframes healthSweep {
          0% { left: -20px; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

// Keep old single HealthBar for backward compat if needed elsewhere
export function HealthBar({ ships, label, mirrored = false }: { ships: PlacedShip[]; label: string; mirrored?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: mirrored ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      width: '100%',
    }}>
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
      <ShipSegments ships={ships} reversed={mirrored} />
      <Counter ships={ships} align={mirrored ? 'left' : 'right'} />
      <style>{`
        @keyframes healthSweep {
          0% { left: -20px; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
