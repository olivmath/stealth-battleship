import React from 'react';
import { useTranslation } from 'react-i18next';
import { RANKS } from '../../stats/interactor';
import { RANK_PROGRESSION } from '../../shared/constants';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../shared/theme';

interface Props {
  totalXP: number;
}

export function RankList({ totalXP }: Props) {
  const { t } = useTranslation();

  let currentIndex = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalXP >= RANKS[i].xp) {
      currentIndex = i;
      break;
    }
  }

  return (
    <div style={{
      border: `1px solid ${COLORS.grid.border}`,
      borderRadius: 4,
      backgroundColor: COLORS.surface.card,
      padding: SPACING.md,
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING.xs,
    }}>
      <span style={{
        fontFamily: FONTS.heading,
        fontSize: FONT_SIZES.label,
        color: COLORS.text.secondary,
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: SPACING.xs,
        display: 'block',
      }}>
        {t('rankList.title')}
      </span>
      {[...RANKS].reverse().map((r, ri) => {
        const i = RANKS.length - 1 - ri;
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;
        const isFuture = i > currentIndex;
        const config = RANK_PROGRESSION.find(p => p.rank === r.rank);

        return (
          <div
            key={r.rank}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: `${SPACING.sm}px ${SPACING.sm}px`,
              borderRadius: 4,
              ...(isCurrent ? {
                border: `1px solid ${COLORS.accent.gold}`,
                backgroundColor: COLORS.overlay.goldSoft,
              } : {}),
              ...(isFuture ? { opacity: 0.45 } : {}),
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.sm,
              flex: 1,
            }}>
              {isPast && (
                <span style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.md,
                  color: COLORS.accent.victory,
                  width: 18,
                  textAlign: 'center',
                }}>
                  {'\u2713'}
                </span>
              )}
              {isCurrent && (
                <span style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: COLORS.accent.gold,
                  width: 18,
                  textAlign: 'center',
                }}>
                  {'\u25CF'}
                </span>
              )}
              {isFuture && (
                <span style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: COLORS.text.secondary,
                  width: 18,
                  textAlign: 'center',
                }}>
                  {'\u25CB'}
                </span>
              )}
              <div style={{ flex: 1 }}>
                <span style={{
                  fontFamily: FONTS.heading,
                  fontSize: FONT_SIZES.sm,
                  color: isCurrent ? COLORS.accent.gold : isFuture ? COLORS.text.secondary : COLORS.text.primary,
                  letterSpacing: 1,
                  display: 'block',
                }}>
                  {t('ranks.' + r.rank).toUpperCase()}
                </span>
                <span style={{
                  fontFamily: FONTS.bodyLight,
                  fontSize: FONT_SIZES.label,
                  color: COLORS.text.secondary,
                  fontStyle: 'italic',
                  marginTop: 1,
                  display: 'block',
                }}>
                  {t('mottos.' + r.rank)}
                </span>
                {config && (
                  <span style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.caption,
                    color: COLORS.text.secondary,
                    marginTop: 2,
                    letterSpacing: 0.5,
                    display: 'block',
                  }}>
                    {config.gridSize}x{config.gridSize} {'\u2022'} {t('rankList.ships', { count: config.ships.length })}
                  </span>
                )}
              </div>
            </div>
            <span style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.sm,
              color: isCurrent ? COLORS.accent.gold : COLORS.text.secondary,
            }}>
              {r.xp.toLocaleString()} XP
            </span>
          </div>
        );
      })}
    </div>
  );
}
