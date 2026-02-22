import React from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '../../shared/theme';
import styles from './TurnIndicator.module.css';

interface Props {
  isPlayerTurn: boolean;
}

export function TurnIndicator({ isPlayerTurn }: Props) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        ...containerStyle,
        ...(isPlayerTurn ? playerContainerStyle : enemyContainerStyle),
      }}
      role="alert"
      aria-live="polite"
      aria-label={isPlayerTurn ? 'Your turn. Tap a cell to fire.' : 'Enemy is firing. Please wait.'}
    >
      <div
        className={styles.dot}
        style={{
          ...dotStyle,
          backgroundColor: isPlayerTurn ? COLORS.accent.gold : COLORS.accent.fire,
        }}
      />
      <span style={{ ...textStyle, ...(isPlayerTurn ? {} : enemyTextStyle) }}>
        {isPlayerTurn ? t('turnIndicator.yourTurn') : t('turnIndicator.enemyFiring')}
      </span>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: SPACING.sm,
  borderRadius: 4,
};

const playerContainerStyle: React.CSSProperties = {
  border: `1px solid ${COLORS.accent.gold}`,
  backgroundColor: COLORS.overlay.goldMedium,
};

const enemyContainerStyle: React.CSSProperties = {
  border: `1px solid ${COLORS.accent.fire}`,
  backgroundColor: COLORS.overlay.fireGlow,
};

const dotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 4,
  marginRight: SPACING.sm,
};

const textStyle: React.CSSProperties = {
  fontFamily: FONTS.heading,
  fontSize: 14,
  color: COLORS.text.accent,
  letterSpacing: 2,
};

const enemyTextStyle: React.CSSProperties = {
  color: COLORS.accent.fire,
};
