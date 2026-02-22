import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PlacedShip } from '../../shared/entities';
import { getShipStyle } from '../../shared/constants';
import { COLORS, FONTS, SPACING, RADIUS } from '../../shared/theme';

interface Props {
  visible: boolean;
  ship: PlacedShip | null;
  onDismiss?: () => void;
}

export function SunkShipModal({ visible, ship, onDismiss }: Props) {
  const { t } = useTranslation();

  const shipStyle = ship ? getShipStyle(ship.id) : null;
  const shipColor = shipStyle?.color ?? COLORS.grid.ship;

  useEffect(() => {
    if (visible && onDismiss) {
      const timer = setTimeout(onDismiss, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible || !ship) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          style={backdropStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            style={containerStyle}
            role="alert"
            aria-label={`Ship sunk! ${ship?.name ?? 'Unknown'} destroyed`}
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: [-20, 200],
              rotate: [0, 15],
              opacity: [1, 1, 0],
            }}
            transition={{
              y: { duration: 1.3, times: [0, 1], ease: ['easeOut', 'easeIn'] },
              rotate: { duration: 1.2, ease: 'easeInOut' },
              opacity: { duration: 1.2, times: [0, 0.67, 1] },
            }}
          >
            <span style={{ ...labelTextStyle, color: shipColor }}>
              {t('battle.shipSunk')}
            </span>
            <span style={shipNameStyle}>
              {t('ships.' + ship.name)}
            </span>
            <div style={shipGraphicStyle}>
              {Array.from({ length: ship.size }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...shipCellStyle,
                    backgroundColor: shipColor,
                    borderColor: shipColor,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: COLORS.overlay.backdropLight,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 900,
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: SPACING.sm,
};

const labelTextStyle: React.CSSProperties = {
  fontFamily: FONTS.heading,
  fontSize: 14,
  letterSpacing: 3,
};

const shipNameStyle: React.CSSProperties = {
  fontFamily: FONTS.heading,
  fontSize: 22,
  color: COLORS.text.primary,
  letterSpacing: 2,
};

const shipGraphicStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 4,
};

const shipCellStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: RADIUS.default,
  border: '1px solid',
  boxSizing: 'border-box',
};
