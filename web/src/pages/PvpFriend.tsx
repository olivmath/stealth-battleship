import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'node_modules/react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { useGame } from '../game/translator';
import { useHaptics } from '../hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../shared/theme';

function generateMatchId(): string {
  const chars = '0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export default function PvpFriend() {
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [matchId, setMatchId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCreate = () => {
    haptics.light();
    const id = generateMatchId();
    setMatchId(id);
    setMode('create');

    timerRef.current = setTimeout(() => {
      haptics.medium();
      dispatch({ type: 'RESET_GAME' });
      navigate('/placement?mode=pvp', { replace: true });
    }, 4000);
  };

  const handleJoin = () => {
    haptics.light();
    setConnecting(true);

    timerRef.current = setTimeout(() => {
      haptics.medium();
      dispatch({ type: 'RESET_GAME' });
      navigate('/placement?mode=pvp', { replace: true });
    }, 2000);
  };

  const handleCancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setConnecting(false);
    setMatchId('');
    setJoinCode('');
    setMode('select');
  };

  if (mode === 'select') {
    return (
      <GradientContainer>
        <div style={styles.container}>
          <div style={styles.header}>
            <span style={styles.title}>{t('pvpFriend.title')}</span>
            <span style={styles.subtitle}>{t('pvpFriend.subtitle')}</span>
            <div style={styles.divider} />
          </div>

          <div style={styles.options}>
            <NavalButton
              title={t('pvpFriend.create')}
              subtitle={t('pvpFriend.createSub')}
              variant="pvp"
              onPress={handleCreate}
            />
            <NavalButton
              title={t('pvpFriend.join')}
              subtitle={t('pvpFriend.joinSub')}
              variant="pvp"
              onPress={() => {
                haptics.light();
                setMode('join');
              }}
            />
          </div>

          <NavalButton
            title={t('pvpFriend.back')}
            variant="danger"
            size="small"
            onPress={() => {
              haptics.light();
              navigate('/pvp-mode', { replace: true });
            }}
          />
        </div>
      </GradientContainer>
    );
  }

  if (mode === 'create') {
    return (
      <GradientContainer>
        <div style={styles.container}>
          <div style={styles.header}>
            <span style={styles.label}>{t('pvpFriend.matchCode')}</span>
            <span style={styles.matchCode}>{matchId}</span>
            <span style={styles.shareText}>{t('pvpFriend.shareCode')}</span>
            <div style={styles.divider} />
          </div>

          <div style={styles.waitingSection}>
            <RadarSpinner size={80} />
            <span style={styles.waitingText}>{t('pvpFriend.waiting')}</span>
          </div>

          <NavalButton
            title={t('pvpFriend.cancel')}
            variant="danger"
            size="small"
            onPress={handleCancel}
          />
        </div>
      </GradientContainer>
    );
  }

  // mode === 'join'
  return (
    <GradientContainer>
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>{t('pvpFriend.joinTitle')}</span>
          <span style={styles.subtitle}>{t('pvpFriend.enterCode')}</span>
          <div style={styles.divider} />
        </div>

        <div style={styles.joinSection}>
          <input
            style={styles.codeInput}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            disabled={connecting}
          />

          {connecting ? (
            <div style={styles.connectingRow}>
              <RadarSpinner size={40} />
              <span style={styles.connectingText}>{t('pvpFriend.connecting')}</span>
            </div>
          ) : (
            <NavalButton
              title={t('pvpFriend.joinBtn')}
              variant="pvp"
              onPress={handleJoin}
              disabled={joinCode.length < 6}
            />
          )}
        </div>

        <NavalButton
          title={t('pvpFriend.back')}
          variant="danger"
          size="small"
          onPress={handleCancel}
        />
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
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.accent.gold,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.accent.gold,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.text.secondary,
    letterSpacing: 3,
  },
  matchCode: {
    fontFamily: FONTS.heading,
    fontSize: 42,
    color: COLORS.accent.gold,
    letterSpacing: 10,
    marginTop: SPACING.sm,
  },
  shareText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.md,
  },
  waitingSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  waitingText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.text.secondary,
    letterSpacing: 3,
  },
  joinSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.lg,
    alignItems: 'center',
  },
  codeInput: {
    width: '100%',
    border: `1.5px solid ${COLORS.accent.gold}`,
    backgroundColor: COLORS.overlay.darkPanel,
    borderRadius: 4,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.lg,
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: COLORS.accent.gold,
    textAlign: 'center',
    letterSpacing: 8,
    outline: 'none',
    boxSizing: 'border-box',
  },
  connectingRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  connectingText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.text.secondary,
    letterSpacing: 3,
  },
};
