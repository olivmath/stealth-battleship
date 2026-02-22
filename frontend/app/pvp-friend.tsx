import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import { useGame } from '../src/game/translator';
import { useHaptics } from '../src/hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../src/shared/theme';

function generateMatchId(): string {
  const chars = '0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export default function PvPFriendScreen() {
  const router = useRouter();
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
      router.replace('/placement?mode=pvp');
    }, 4000);
  };

  const handleJoin = () => {
    haptics.light();
    setConnecting(true);

    timerRef.current = setTimeout(() => {
      haptics.medium();
      dispatch({ type: 'RESET_GAME' });
      router.replace('/placement?mode=pvp');
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
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('pvpFriend.title')}</Text>
            <Text style={styles.subtitle}>{t('pvpFriend.subtitle')}</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.options}>
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
          </View>

          <NavalButton
            title={t('pvpFriend.back')}
            variant="danger"
            size="small"
            onPress={() => {
              haptics.light();
              router.replace('/pvp-mode');
            }}
          />
        </View>
      </GradientContainer>
    );
  }

  if (mode === 'create') {
    return (
      <GradientContainer>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.label}>{t('pvpFriend.matchCode')}</Text>
            <Text style={styles.matchCode}>{matchId}</Text>
            <Text style={styles.shareText}>{t('pvpFriend.shareCode')}</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.waitingSection}>
            <RadarSpinner size={80} />
            <Text style={styles.waitingText}>{t('pvpFriend.waiting')}</Text>
          </View>

          <NavalButton
            title={t('pvpFriend.cancel')}
            variant="danger"
            size="small"
            onPress={handleCancel}
          />
        </View>
      </GradientContainer>
    );
  }

  // mode === 'join'
  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('pvpFriend.joinTitle')}</Text>
          <Text style={styles.subtitle}>{t('pvpFriend.enterCode')}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.joinSection}>
          <TextInput
            style={styles.codeInput}
            value={joinCode}
            onChangeText={(text) => setJoinCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="000000"
            placeholderTextColor={COLORS.overlay.goldStrong}
            maxLength={6}
            keyboardType="number-pad"
            autoCorrect={false}
            editable={!connecting}
          />

          {connecting ? (
            <View style={styles.connectingRow}>
              <RadarSpinner size={40} />
              <Text style={styles.connectingText}>{t('pvpFriend.connecting')}</Text>
            </View>
          ) : (
            <NavalButton
              title={t('pvpFriend.joinBtn')}
              variant="pvp"
              onPress={handleJoin}
              disabled={joinCode.length < 6}
            />
          )}
        </View>

        <NavalButton
          title={t('pvpFriend.back')}
          variant="danger"
          size="small"
          onPress={handleCancel}
        />
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  header: {
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
    gap: SPACING.md,
  },
  waitingSection: {
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
    gap: SPACING.lg,
    alignItems: 'center',
  },
  codeInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.accent.gold,
    backgroundColor: COLORS.overlay.darkPanel,
    borderRadius: 4,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: COLORS.accent.gold,
    textAlign: 'center',
    letterSpacing: 8,
  },
  connectingRow: {
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
});
