import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/UI/PageShell';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { useGame } from '../game/translator';
import { usePvP } from '../pvp/translator';
import { useHaptics } from '../hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../shared/theme';

export default function PvpFriend() {
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const pvp = usePvP();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [joinCode, setJoinCode] = useState('');
  // matchCode comes from PvP context

  // Navigate when both players joined
  useEffect(() => {
    if (pvp.phase === 'placing' && pvp.match?.opponentKey) {
      haptics.medium();
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET_GAME' });
        navigate('/placement?mode=pvp', { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pvp.phase, pvp.match?.opponentKey]);

  const handleCreate = () => {
    haptics.light();
    setMode('create');
    pvp.createFriendMatch(10);
  };

  const handleJoin = () => {
    haptics.light();
    pvp.joinFriendMatch(joinCode);
  };

  const handleCancel = () => {
    pvp.cancelSearch();
    setJoinCode('');
    setMode('select');
  };

  if (mode === 'select') {
    return (
      <PageShell
        title={t('pvpFriend.title')}
        subtitle={t('pvpFriend.subtitle')}
        actions={
          <NavalButton
            title={t('pvpFriend.back')}
            variant="ghost"
            size="small"
            onPress={() => {
              haptics.light();
              navigate('/pvp-mode', { replace: true });
            }}
          />
        }
      >
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
      </PageShell>
    );
  }

  if (mode === 'create') {
    return (
      <PageShell
        hideHeader
        actions={
          <NavalButton
            title={t('pvpFriend.cancel')}
            variant="ghost"
            size="small"
            onPress={handleCancel}
          />
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: SPACING.xxl }}>
          <span style={styles.label}>{t('pvpFriend.matchCode')}</span>
          <span style={styles.matchCode}>{pvp.matchCode || '...'}</span>
          <span style={styles.shareText}>{t('pvpFriend.shareCode')}</span>
        </div>
        <div style={styles.waitingSection}>
          <RadarSpinner size={80} />
          <span style={styles.waitingText}>{t('pvpFriend.waiting')}</span>
        </div>
      </PageShell>
    );
  }

  // mode === 'join'
  return (
    <PageShell
      title={t('pvpFriend.joinTitle')}
      subtitle={t('pvpFriend.enterCode')}
      actions={
        <NavalButton
          title={t('pvpFriend.back')}
          variant="ghost"
          size="small"
          onPress={handleCancel}
        />
      }
    >
      <div style={styles.joinSection}>
        <input
          style={styles.codeInput}
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          inputMode="numeric"
          disabled={pvp.phase === 'connecting'}
        />

        {pvp.phase === 'connecting' ? (
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

        {pvp.error && (
          <span style={styles.errorText}>{pvp.error}</span>
        )}
      </div>
    </PageShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
    textAlign: 'center' as const,
    letterSpacing: 8,
    boxSizing: 'border-box' as const,
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
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.accent.fire,
    textAlign: 'center' as const,
  },
};
