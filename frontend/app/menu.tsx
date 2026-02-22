import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useGame } from '../src/game/translator';
import { usePlayerStats } from '../src/stats/translator';
import { useSettings } from '../src/settings/translator';
import { useHaptics } from '../src/hooks/useHaptics';
import { getLevelInfo } from '../src/stats/interactor';
import { COLORS, FONTS, SPACING, RADIUS } from '../src/shared/theme';
import NavalText from '../src/components/UI/NavalText';
import Divider from '../src/components/UI/Divider';

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
          <NavalText variant="label" letterSpacing={3}>{t('menu.welcome')}</NavalText>
          <NavalText variant="h2" style={{ marginTop: SPACING.xs }}>{state.playerName}</NavalText>
          <Divider style={{ marginTop: SPACING.md }} />
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

        {/* Actions */}
        <View style={styles.actions}>
          {/* Tier 1 — Play Modes */}
          <Animated.View entering={FadeInDown.delay(0).duration(400)}>
            <NavalButton
              title={t('menu.arcade')}
              subtitle={t('menu.arcadeSub')}
              onPress={handleStartBattle}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            <NavalButton
              title={t('menu.pvp')}
              subtitle={t('menu.pvpSub')}
              variant="pvp"
              onPress={() => {
                haptics.light();
                router.replace('/pvp-mode');
              }}
            />
          </Animated.View>

          {/* Tier 2 — Player Info */}
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.rowGroup}>
            <NavalButton
              title={t('menu.profile')}
              onPress={() => {
                haptics.light();
                router.push('/profile');
              }}
              variant="secondary"
              size="small"
              style={styles.rowButton}
            />
            <NavalButton
              title={t('menu.history')}
              onPress={() => {
                haptics.light();
                router.push('/match-history');
              }}
              variant="secondary"
              size="small"
              style={styles.rowButton}
            />
          </Animated.View>

          {/* Tier 3 — Utility */}
          <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.rowGroup}>
            <NavalButton
              title={t('menu.wallet')}
              onPress={() => {
                haptics.light();
                router.push('/wallet');
              }}
              variant="secondary"
              size="small"
              style={styles.rowButton}
            />
            <NavalButton
              title={t('menu.settings')}
              onPress={() => {
                haptics.light();
                router.push('/settings');
              }}
              variant="secondary"
              size="small"
              style={styles.rowButton}
            />
          </Animated.View>

          {/* Tier 4 — Logout */}
          <Animated.View entering={FadeInDown.delay(320).duration(400)}>
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
                        const { clearWallet } = await import('../src/wallet/interactor');
                        await clearPlayerData();
                        await clearWallet();
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
          </Animated.View>
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
    borderRadius: RADIUS.default,
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
    gap: SPACING.sm,
    marginTop: 'auto',
  },
  rowGroup: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rowButton: {
    flex: 1,
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
