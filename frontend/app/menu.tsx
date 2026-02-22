import React, { useEffect, lazy, Suspense } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import RadarSpinner from '../src/components/UI/RadarSpinner';

const ShipModel = lazy(() => import('../src/components/UI/ShipModel'));
import { useGame } from '../src/game/translator';
import { usePlayerStats } from '../src/stats/translator';
import { useSettings } from '../src/settings/translator';
import { useHaptics } from '../src/hooks/useHaptics';
import { getLevelInfo } from '../src/stats/interactor';
import { COLORS, FONTS, SPACING } from '../src/shared/theme';

export default function MenuScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { state, dispatch } = useGame();
  const { stats, refresh } = usePlayerStats();
  const { settings, refresh: refreshSettings } = useSettings();
  const haptics = useHaptics();

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
      // Persist updated settings + reset tutorial for new grid (fire-and-forget)
      import('../src/settings/interactor').then(m => {
        m.saveSettings(updated);
        m.setTutorialSeen(false);
      });
    }
  }, [stats?.totalXP]);

  const handleStartBattle = async () => {
    haptics.light();
    dispatch({ type: 'RESET_GAME' });
    const { hasSeenTutorial } = await import('../src/settings/interactor');
    const seen = await hasSeenTutorial();
    router.replace(seen ? '/placement' : '/tutorial');
  };

  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcome}>{t('menu.welcome')}</Text>
          <Text style={styles.name}>{state.playerName}</Text>
          <View style={styles.divider} />
        </View>

        {/* Stats Row */}
        {stats && (
          <View style={styles.statsRow}>
            <Text style={styles.rankBadge}>{t('ranks.' + getLevelInfo(stats.totalXP).rank).toUpperCase()}</Text>
            <Text style={styles.winRateText}>
              {stats.wins + stats.losses > 0
                ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
                : 0}% {t('menu.winRate')}
            </Text>
          </View>
        )}

        <Suspense fallback={<View style={{ height: 200, alignItems: 'center', justifyContent: 'center' }}><RadarSpinner size={40} /></View>}>
          <ShipModel height={200} />
        </Suspense>

        {/* Actions */}
        <View style={styles.actions}>
          <NavalButton
            title={t('menu.arcade')}
            subtitle={t('menu.arcadeSub')}
            onPress={handleStartBattle}
          />
          <NavalButton
            title={t('menu.pvp')}
            subtitle={t('menu.pvpSub')}
            variant="pvp"
            onPress={() => {
              haptics.light();
              router.replace('/pvp-mode');
            }}
          />
          <NavalButton
            title={t('menu.history')}
            onPress={() => {
              haptics.light();
              router.push('/match-history');
            }}
            variant="secondary"
          />
          <NavalButton
            title={t('menu.profile')}
            onPress={() => {
              haptics.light();
              router.push('/profile');
            }}
            variant="secondary"
          />
          <NavalButton
            title={t('menu.settings')}
            onPress={() => {
              haptics.light();
              router.push('/settings');
            }}
            variant="secondary"
          />
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              Alert.alert(
                t('menu.logoutTitle'),
                t('menu.logoutMsg'),
                [
                  { text: t('menu.logoutCancel'), style: 'cancel' },
                  {
                    text: t('menu.logoutConfirm'),
                    style: 'destructive',
                    onPress: async () => {
                      const { clearPlayerData } = await import('../src/game/adapter');
                      await clearPlayerData();
                      router.replace('/login');
                    },
                  },
                ]
              );
            }}
            style={styles.logoutButton}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>{t('menu.logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  welcome: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.text.secondary,
    letterSpacing: 3,
  },
  name: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: COLORS.text.accent,
    letterSpacing: 2,
    marginTop: SPACING.xs,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.accent.gold,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  statsRow: {
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
    borderWidth: 1,
    borderColor: COLORS.accent.gold,
    borderRadius: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  winRateText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  actions: {
    gap: SPACING.md,
    marginTop: 'auto',
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  logoutText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    opacity: 0.7,
  },
});
