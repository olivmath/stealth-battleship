import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useHaptics } from '../src/hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

export default function PvPModeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const haptics = useHaptics();

  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('pvpMode.title')}</Text>
          <Text style={styles.subtitle}>{t('pvpMode.subtitle')}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.options}>
          <NavalButton
            title={t('pvpMode.random')}
            subtitle={t('pvpMode.randomSub')}
            variant="pvp"
            onPress={() => {
              haptics.light();
              router.replace('/pvp-lobby');
            }}
          />
          <NavalButton
            title={t('pvpMode.friend')}
            subtitle={t('pvpMode.friendSub')}
            variant="pvp"
            onPress={() => {
              haptics.light();
              router.replace('/pvp-friend');
            }}
          />
        </View>

        <NavalButton
          title={t('pvpMode.back')}
          variant="danger"
          size="small"
          onPress={() => {
            haptics.light();
            router.replace('/menu');
          }}
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
    fontSize: 28,
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
  options: {
    gap: SPACING.md,
  },
});
