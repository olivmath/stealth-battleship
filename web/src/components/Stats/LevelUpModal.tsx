import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LevelInfo } from '../../shared/entities';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../shared/theme';

interface Props {
  visible: boolean;
  levelInfo: LevelInfo;
  previousLevelInfo?: LevelInfo;
  onDismiss?: () => void;
}

export function LevelUpModal({ visible, levelInfo, previousLevelInfo, onDismiss }: Props) {
  const { t } = useTranslation();

  if (!visible) return null;

  const gridChanged = previousLevelInfo && previousLevelInfo.gridSize !== levelInfo.gridSize;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          style={{
            position: 'fixed',
            inset: 0,
            background: COLORS.overlay.backdrop,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: SPACING.sm,
              border: `2px solid ${COLORS.accent.gold}`,
              borderRadius: RADIUS.md,
              padding: SPACING.xl,
              backgroundColor: COLORS.background.dark,
              ...SHADOWS.lg,
            }}
          >
            <span style={{
              fontFamily: FONTS.heading,
              fontSize: 12,
              color: COLORS.accent.gold,
              letterSpacing: 4,
            }}>
              {t('levelUp.title')}
            </span>
            <span style={{
              fontFamily: FONTS.heading,
              fontSize: FONT_SIZES.h1,
              color: COLORS.accent.gold,
              letterSpacing: 3,
            }}>
              {t('ranks.' + levelInfo.rank).toUpperCase()}
            </span>
            <span style={{
              fontFamily: FONTS.bodyLight,
              fontSize: FONT_SIZES.md,
              color: COLORS.text.secondary,
              fontStyle: 'italic',
            }}>
              {t('mottos.' + levelInfo.rank)}
            </span>
            {gridChanged && (
              <span style={{
                fontFamily: FONTS.heading,
                fontSize: FONT_SIZES.md,
                color: COLORS.accent.victory,
                letterSpacing: 2,
                marginTop: SPACING.xs,
              }}>
                {t('levelUp.newGrid', { gridSize: levelInfo.gridSize })}
              </span>
            )}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              marginTop: SPACING.sm,
            }}>
              <span style={{
                fontFamily: FONTS.heading,
                fontSize: FONT_SIZES.caption,
                color: COLORS.text.secondary,
                letterSpacing: 2,
                marginBottom: 4,
              }}>
                {t('levelUp.yourFleet')}
              </span>
              {levelInfo.ships.map((s, i) => (
                <span key={`${s.id}-${i}`} style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: COLORS.text.primary,
                }}>
                  {t('ships.' + s.name)} ({s.size})
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
