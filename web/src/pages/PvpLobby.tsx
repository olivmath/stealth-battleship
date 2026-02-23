import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { OpponentStatus } from '../components/PvP/OpponentStatus';
import { useGame } from '../game/translator';
import { usePvP } from '../pvp/translator';
import { useHaptics } from '../hooks/useHaptics';
import { COLORS, FONTS, SPACING, LAYOUT } from '../shared/theme';

export default function PvpLobby() {
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const pvp = usePvP();
  const haptics = useHaptics();
  const { t } = useTranslation();

  const isSearching = pvp.phase === 'searching' || pvp.phase === 'connecting';
  const isFound = pvp.phase === 'placing' || pvp.phase === 'found';

  // Start search on mount
  useEffect(() => {
    if (pvp.myPublicKeyHex && pvp.phase !== 'searching') {
      pvp.findRandomMatch(10);
    }
  }, [pvp.myPublicKeyHex]);

  // Navigate when match found
  useEffect(() => {
    if (isFound && pvp.match) {
      haptics.medium();
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET_GAME' });
        navigate('/placement?mode=pvp', { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isFound, pvp.match]);

  const opponentName = pvp.match?.opponentKey
    ? pvp.match.opponentKey.slice(0, 8) + '...'
    : '';

  return (
    <GradientContainer>
      <div style={styles.container}>
        <div style={styles.content}>
          {isSearching ? (
            <>
              <RadarSpinner size={120} />
              <span style={styles.statusText}>{t('pvpLobby.searching')}</span>
            </>
          ) : isFound ? (
            <>
              <OpponentStatus name={opponentName} status="online" />
              <span style={styles.foundText}>{t('pvpLobby.found')}</span>
            </>
          ) : pvp.phase === 'error' ? (
            <>
              <span style={styles.errorText}>{pvp.error || 'Connection failed'}</span>
              <NavalButton
                title="Retry"
                variant="pvp"
                onPress={() => pvp.findRandomMatch(10)}
              />
            </>
          ) : (
            <RadarSpinner size={120} />
          )}
        </div>

        {isSearching && (
          <NavalButton
            title={t('pvpLobby.cancel')}
            variant="danger"
            onPress={() => {
              pvp.cancelSearch();
              navigate('/menu', { replace: true });
            }}
          />
        )}
      </div>
    </GradientContainer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    boxSizing: 'border-box' as const,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  statusText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.text.secondary,
    letterSpacing: 3,
  },
  foundText: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.accent.victory,
    letterSpacing: 3,
  },
  errorText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.accent.fire,
    letterSpacing: 2,
    textAlign: 'center' as const,
  },
};
