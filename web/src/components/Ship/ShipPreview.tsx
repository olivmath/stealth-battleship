import React from 'react';
import { Orientation } from '../../shared/entities';
import { COLORS, SPACING } from '../../shared/theme';

interface Props {
  shipSize: number;
  orientation: Orientation;
  onToggle: () => void;
}

function MiniShip({ size, direction }: { size: number; direction: Orientation }) {
  return (
    <div style={direction === 'horizontal' ? miniRowStyle : miniColStyle}>
      {Array.from({ length: size }).map((_, i) => (
        <div key={i} style={miniCellStyle} />
      ))}
    </div>
  );
}

const miniRowStyle: React.CSSProperties = { display: 'flex', flexDirection: 'row', gap: 2 };
const miniColStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 };
const miniCellStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  backgroundColor: COLORS.accent.gold,
  borderRadius: 2,
};

export function ShipPreview({ shipSize, orientation, onToggle }: Props) {
  const isH = orientation === 'horizontal';

  return (
    <div style={containerStyle}>
      <button
        style={{ ...optionStyle, ...(isH ? optionActiveStyle : {}) }}
        onClick={isH ? undefined : onToggle}
        role="radio"
        aria-checked={isH}
        aria-label="Horizontal"
      >
        <MiniShip size={shipSize} direction="horizontal" />
      </button>
      <button
        style={{ ...optionStyle, ...(!isH ? optionActiveStyle : {}) }}
        onClick={isH ? onToggle : undefined}
        role="radio"
        aria-checked={!isH}
        aria-label="Vertical"
      >
        <MiniShip size={shipSize} direction="vertical" />
      </button>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: SPACING.sm,
  alignItems: 'center',
};

const optionStyle: React.CSSProperties = {
  width: 68,
  height: 68,
  borderRadius: 4,
  border: `1px solid ${COLORS.grid.border}`,
  backgroundColor: COLORS.surface.subtle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
};

const optionActiveStyle: React.CSSProperties = {
  borderColor: COLORS.accent.gold,
  backgroundColor: COLORS.overlay.goldMedium,
};
