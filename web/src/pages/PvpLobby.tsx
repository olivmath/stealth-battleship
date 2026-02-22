import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { OpponentStatus } from '../components/PvP/OpponentStatus';
import { useGame } from '../game/translator';
import { useHaptics } from '../hooks/useHaptics';
import { MOCK_OPPONENT, MATCHMAKING_DELAY, FOUND_DELAY } from '../services/pvpMock';
import { COLORS, FONTS, SPACING } from '../shared/theme';

export default function PvpLobby() {
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'searching' | 'found'>('searching');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('found');
      haptics.medium();

      const t2 = setTimeout(() => {
        dispatch({ type: 'RESET_GAME' });
        navigate('/placement?mode=pvp', { replace: true });
      }, FOUND_DELAY);

      timersRef.current.push(t2);
    }, MATCHMAKING_DELAY);

    timersRef.current.push(t1);

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <GradientContainer>
      <div style={styles.container}>
        <div style={styles.content}>
          {phase === 'searching' ? (
            <>
              <RadarSpinner size={120} />
              <span style={styles.statusText}>{t('pvpLobby.searching')}</span>
            </>
          ) : (
            <>
              <OpponentStatus name={MOCK_OPPONENT} status="online" />
              <span style={styles.foundText}>{t('pvpLobby.found')}</span>
            </>
          )}
        </div>

        {phase === 'searching' && (
          <NavalButton
            title={t('pvpLobby.cancel')}
            variant="danger"
            onPress={() => {
              timersRef.current.forEach(clearTimeout);
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
};
