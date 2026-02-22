import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShipKillEfficiency } from '../../shared/entities';
import { COLORS, FONTS, FONT_SIZES } from '../../shared/theme';

interface Props {
  item: ShipKillEfficiency;
  showLegend?: boolean;
}

export function KillEfficiencyBar({ item, showLegend = true }: Props) {
  const { t } = useTranslation();
  const maxShots = Math.max(item.actualShots, item.idealShots);
  const idealWidth = maxShots > 0 ? (item.idealShots / maxShots) * 100 : 0;
  const actualWidth = maxShots > 0 ? (item.actualShots / maxShots) * 100 : 0;
  const isPerfect = item.actualShots === item.idealShots;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: FONTS.body,
          fontSize: FONT_SIZES.body,
          color: COLORS.text.primary,
        }}>
          {item.shipName}
        </span>
        <span style={{
          fontFamily: FONTS.body,
          fontSize: 12,
          color: isPerfect ? COLORS.accent.gold : COLORS.text.secondary,
        }}>
          {item.idealShots}/{item.actualShots} {isPerfect ? 'PERFECT' : ''}
        </span>
      </div>
      <div style={{
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.surface.cardBorder,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          height: '100%',
          borderRadius: 4,
          backgroundColor: COLORS.accent.fire,
          opacity: 0.6,
          width: `${actualWidth}%`,
        }} />
        <div style={{
          position: 'absolute',
          height: '100%',
          borderRadius: 4,
          backgroundColor: COLORS.accent.gold,
          width: `${idealWidth}%`,
        }} />
      </div>
      {showLegend && (
        <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: COLORS.accent.gold,
            }} />
            <span style={{
              fontFamily: FONTS.bodyLight,
              fontSize: FONT_SIZES.label,
              color: COLORS.text.secondary,
            }}>
              {t('stats.ideal', 'Ideal')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: COLORS.accent.fire,
            }} />
            <span style={{
              fontFamily: FONTS.bodyLight,
              fontSize: FONT_SIZES.label,
              color: COLORS.text.secondary,
            }}>
              {t('stats.actual', 'Actual')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
