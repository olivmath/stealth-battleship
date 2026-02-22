import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, FONTS, FONT_SIZES } from '../../shared/theme';
import styles from './SunkShipModal.module.css';

interface SunkShipModalProps {
  visible: boolean;
  shipName?: string;
  ship?: { name: string } | null;
  onDismiss: () => void;
}

export function SunkShipModal({ visible, shipName: shipNameProp, ship, onDismiss }: SunkShipModalProps) {
  const shipName = shipNameProp ?? ship?.name ?? '';
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDismiss, 2000);
      return () => clearTimeout(t);
    }
  }, [visible, onDismiss]);

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}>
          <motion.div className={styles.content}
            initial={{ y: -50, rotate: 0, opacity: 0 }}
            animate={{ y: 0, rotate: 5, opacity: 1 }}
            exit={{ y: 100, rotate: 15, opacity: 0 }}
            transition={{ type: 'spring', damping: 12 }}>
            <div style={{ fontFamily: FONTS.heading, fontSize: FONT_SIZES.h3, color: COLORS.accent.fire, letterSpacing: 3, textTransform: 'uppercase' }}>
              SHIP SUNK!
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: FONT_SIZES.lg, color: COLORS.text.primary }}>
              {shipName}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
