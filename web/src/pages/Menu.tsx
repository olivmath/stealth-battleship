import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { NavalText } from '../components/UI/NavalText';
import { Divider } from '../components/UI/Divider';
import { useGame } from '../game/translator';
import { usePlayerStats } from '../stats/translator';
import { useSettings } from '../settings/translator';
import { useHaptics } from '../hooks/useHaptics';
import { useResponsive } from '../hooks/useResponsive';
import { getLevelInfo } from '../stats/interactor';
import { confirm } from '../hooks/useConfirm';
import { COLORS, FONTS, SPACING, RADIUS, LAYOUT } from '../shared/theme';
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
    <GradientContainer>
      <div style={{
        ...styles.container,
        ...(!isMobile ? {
          maxWidth: isDesktop ? LAYOUT.maxContentWidthDesktop : LAYOUT.maxContentWidthTablet,
          alignSelf: 'center',
          width: '100%',
        } : {}),
      }}>
        <div style={styles.header}>
          <NavalText variant="label" letterSpacing={3}>{t('menu.welcome')}</NavalText>
          <NavalText variant="h2" style={{ marginTop: SPACING.xs }}>{state.playerName}</NavalText>
          <Divider style={{ marginTop: SPACING.md }} />
        </div>

        <Ship3D />

        {/* Stats Row */}
        {stats && (
          <div style={styles.statsRow}>
            <span style={styles.rankBadge}>{t('ranks.' + getLevelInfo(stats.totalXP).rank).toUpperCase()}</span>
            <span style={styles.winRateText}>
              {stats.wins + stats.losses > 0
                ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
                : 0}% {t('menu.winRate')}
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          {/* Tier 1 - Play Modes */}
          <div style={fadeIn(1)}>
            <NavalButton
              title={t('menu.arcade')}
              subtitle={t('menu.arcadeSub')}
              onPress={handleStartBattle}
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
    gap: SPACING.md,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  statsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  rankBadge: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.accent.gold,
    letterSpacing: 2,
    border: `1px solid ${COLORS.accent.gold}`,
    borderRadius: RADIUS.default,
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.sm,
    paddingTop: 2,
    paddingBottom: 2,
  },
  winRateText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.text.secondary,
    letterSpacing: 1,
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
