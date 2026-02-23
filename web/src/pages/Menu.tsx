import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/UI/PageShell';
import { NavalButton } from '../components/UI/NavalButton';
import { useGame } from '../game/translator';
import { usePlayerStats } from '../stats/translator';
import { useSettings } from '../settings/translator';
import { useHaptics } from '../hooks/useHaptics';
import { useResponsive } from '../hooks/useResponsive';
import { getLevelInfo } from '../stats/interactor';
import { confirm } from '../hooks/useConfirm';
import { COLORS, FONTS, SPACING } from '../shared/theme';
import { Ship3D } from '../components/Ship/Ship3D';

export default function Menu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { stats, refresh } = usePlayerStats();
  const { settings, refresh: refreshSettings } = useSettings();
  const haptics = useHaptics();
  const { isMobile, isDesktop } = useResponsive();
  const [animStage, setAnimStage] = useState(0);

  useEffect(() => {
    refresh();
    refreshSettings();
  }, [refresh, refreshSettings]);

  useEffect(() => {
    if (stats) {
      dispatch({ type: 'LOAD_STATS', stats });
    }
  }, [stats, dispatch]);

  useEffect(() => {
    if (settings) {
      dispatch({ type: 'LOAD_SETTINGS', settings });
    }
  }, [settings, dispatch]);

  // Auto-derive gridSize from rank
  useEffect(() => {
    if (!stats) return;
    const level = getLevelInfo(stats.totalXP);
    if (level.gridSize !== settings.gridSize) {
      const updated = { ...settings, gridSize: level.gridSize };
      dispatch({ type: 'LOAD_SETTINGS', settings: updated });
      import('../settings/interactor').then(m => {
        m.saveSettings(updated);
        m.setTutorialSeen(false);
      });
    }
  }, [stats?.totalXP]);

  // Staggered animation
  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimStage(1), 0),
      setTimeout(() => setAnimStage(2), 80),
      setTimeout(() => setAnimStage(3), 160),
      setTimeout(() => setAnimStage(4), 240),
      setTimeout(() => setAnimStage(5), 320),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleStartBattle = async () => {
    haptics.light();
    dispatch({ type: 'RESET_GAME' });
    const { hasSeenTutorial } = await import('../settings/interactor');
    const seen = await hasSeenTutorial();
    navigate(seen ? '/placement' : '/tutorial', { replace: true });
  };

  const fadeIn = (stage: number): React.CSSProperties => ({
    opacity: animStage >= stage ? 1 : 0,
    transform: animStage >= stage ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  });

  return (
    <PageShell
      title={state.playerName}
      subtitle={t('menu.welcome')}
    >
      <div style={styles.shipContainer}>
        <Ship3D />
      </div>

      <div style={styles.actions}>
          {/* Tier 1 - Play Modes */}
          <div style={fadeIn(1)}>
            <NavalButton
              title={t('menu.arcade')}
              subtitle={t('menu.arcadeSub')}
              onPress={handleStartBattle}
              style={{ width: '100%' }}
            />
          </div>
          <div style={fadeIn(2)}>
            <NavalButton
              title={t('menu.pvp')}
              subtitle={t('menu.pvpSub')}
              variant="pvp"
              onPress={() => {
                haptics.light();
                navigate('/pvp-mode', { replace: true });
              }}
              style={{ width: '100%' }}
            />
          </div>

          {/* Tier 2 - Player Info */}
          <div style={{ ...fadeIn(3), ...styles.rowGroup }}>
            <NavalButton
              title={t('menu.profile')}
              onPress={() => {
                haptics.light();
                navigate('/profile');
              }}
              variant="secondary"
              size="small"
              style={styles.rowButton}
            />
            <NavalButton
              title={t('menu.history')}
              onPress={() => {
                haptics.light();
                navigate('/match-history');
              }}
              variant="secondary"
              size="small"
              style={styles.rowButton}
            />
          </div>

          {/* Tier 3 - Utility */}
          <div style={{ ...fadeIn(4), ...styles.rowGroup }}>
            <NavalButton
              title={t('menu.wallet')}
              onPress={() => {
                haptics.light();
                navigate('/wallet');
              }}
              variant="secondary"
              size="small"
              style={styles.rowButton}
            />
            <NavalButton
              title={t('menu.settings')}
              onPress={() => {
                haptics.light();
                navigate('/settings');
              }}
              variant="secondary"
              size="small"
              style={styles.rowButton}
            />
          </div>

          {/* Tier 4 - Logout */}
          <div style={fadeIn(5)}>
            <button
              onClick={() => {
                haptics.light();
                confirm({
                  title: t('menu.logoutTitle'),
                  message: t('menu.logoutMsg'),
                  cancelText: t('menu.logoutCancel'),
                  confirmText: t('menu.logoutConfirm'),
                  onConfirm: async () => {
                    const { clearPlayerData } = await import('../game/adapter');
                    const { clearWallet } = await import('../wallet/interactor');
                    await clearPlayerData();
                    await clearWallet();
                    navigate('/login', { replace: true });
                  },
                });
              }}
              style={styles.logoutButton}
            >
              <span style={styles.logoutText}>{t('menu.logout')}</span>
            </button>
          </div>
      </div>
    </PageShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shipContainer: {
    maxHeight: 200,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.sm,
    marginTop: 'auto',
  },
  rowGroup: {
    display: 'flex',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rowButton: {
    flex: 1,
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  logoutText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    opacity: 0.7,
  },
};
