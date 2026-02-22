import React from 'react';
import { COLORS, FONTS, FONT_SIZES } from '../../shared/theme';

interface Props {
  length: number;
  label: string;
}

export function ShipShape({ length, label }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
      }}>
        {Array.from({ length }).map((_, i) => (
          <div key={i} style={{
            width: 22,
            height: 22,
            backgroundColor: COLORS.grid.ship,
            border: `1px solid ${COLORS.grid.shipLight}`,
            borderTopLeftRadius: i === 0 ? 6 : 0,
            borderBottomLeftRadius: i === 0 ? 6 : 0,
            borderTopRightRadius: i === length - 1 ? 6 : 0,
            borderBottomRightRadius: i === length - 1 ? 6 : 0,
          }} />
        ))}
      </div>
      <span style={{
        fontFamily: FONTS.body,
        fontSize: FONT_SIZES.body,
        color: COLORS.text.secondary,
      }}>
        {label}
      </span>
    </div>
  );
}
