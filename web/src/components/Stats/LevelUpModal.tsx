import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NavalText } from '../UI/NavalText';
import { NavalButton } from '../UI/NavalButton';
import { COLORS, FONTS, FONT_SIZES } from '../../shared/theme';
import styles from './LevelUpModal.module.css';

interface LevelUpModalProps {
  visible: boolean;
  rankName?: string;
  motto?: string;
  levelInfo?: any;
  previousLevelInfo?: any;
  onDismiss: () => void;
}

export function LevelUpModal({ visible, rankName: rankNameProp, motto: mottoProp, levelInfo, previousLevelInfo, onDismiss }: LevelUpModalProps) {
  const rankName = rankNameProp ?? levelInfo?.rank ?? '';
  const motto = mottoProp ?? levelInfo?.motto ?? '';
  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div className={styles.overlay}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className={styles.content}
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', damping: 15 }}
            style={{ borderColor: COLORS.accent.gold }}>
            <NavalText variant="label" color={COLORS.accent.gold}>RANK UP!</NavalText>
            <NavalText variant="h2" color={COLORS.text.primary}>{rankName}</NavalText>
            <NavalText variant="caption" color={COLORS.text.secondary} align="center">{motto}</NavalText>
            <NavalButton title="Dismiss" onPress={onDismiss} variant="ghost" size="sm" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
