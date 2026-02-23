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
 * Minimal dual health bar: [YOU ████→  ][  ←████ ENEMY]
 * Both bars start at edges and shrink toward center. Label inside.
 */
export function HealthBarDual({ playerShips, opponentShips }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      width: '100%',
    }}>
      <HealthBarSide ships={playerShips} label="YOU" side="left" />
      <HealthBarSide ships={opponentShips} label="ENEMY" side="right" />

      <style>{`
        @keyframes healthSweep {
          0% { left: -20px; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

function HealthBarSide({ ships, label, side }: { ships: PlacedShip[]; label: string; side: 'left' | 'right' }) {
  const totalCells = ships.reduce((sum, s) => sum + s.size, 0);
  const isRight = side === 'right';

  // Build flat array: total segments, alive count from center outward
  const hitCells = ships.reduce((sum, s) => sum + s.hits, 0);
  const alive = totalCells - hitCells;

  return (
    <div style={{
      flex: 1,
      height: 18,
      borderRadius: 2,
      border: `1px solid ${COLORS.grid.border}`,
      backgroundColor: 'rgba(10, 14, 26, 0.7)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      padding: '3px 3px',
      gap: 2,
      flexDirection: isRight ? 'row' : 'row-reverse',
    }}>
      {/* Segments — alive from center, dead from outer edge, letter on each */}
      {Array.from({ length: totalCells }).map((_, i) => {
        // i=0 is center side, i=last is outer edge
        const isAlive = i < alive;
        // Letters on outer-edge blocks, reading naturally left-to-right
        // flexDirection: left='row-reverse' (i=0 at right/center, i=last at left/outer)
        // flexDirection: right='row' (i=0 at left/center, i=last at right/outer)
        // In both cases i=last is the outer edge.
        // Left side: outer blocks are leftmost visually → label reads L→R from left edge
        //   visual position (left→right) = totalCells-1-i, so letterIdx = totalCells-1-i
        // Right side: outer blocks are rightmost visually → label reads L→R ending at right edge
        //   visual position from right = totalCells-1-i, letterIdx from right = label.length-1-(totalCells-1-i - (totalCells-label.length))
        const visualFromOuter = totalCells - 1 - i; // 0=outermost
        let letter: string | null = null;
        if (visualFromOuter < label.length) {
          // Left: outermost=label[0], next=label[1]... reads L→R from left edge
          // Right: outermost=label[label.length-1], next=label[label.length-2]... reads L→R from right edge
          letter = isRight ? label[label.length - 1 - visualFromOuter] : label[visualFromOuter];
        }
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: '100%',
              borderRadius: 1,
              transition: 'all 0.4s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...(isAlive ? {
                backgroundColor: COLORS.accent.gold,
                boxShadow: `0 0 4px ${COLORS.accent.gold}40`,
              } : {
                backgroundColor: COLORS.cell.sunk,
                opacity: 0.3,
              }),
            }}
          >
            {letter && (
              <span style={{
                fontFamily: FONTS.heading,
                fontSize: 7,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1,
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}>
                {letter}
              </span>
            )}
          </div>
        );
      })}
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
