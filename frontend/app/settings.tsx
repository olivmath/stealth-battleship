import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useSettings, usePlayerStats } from '../src/hooks/useStorage';
import { useHaptics } from '../src/hooks/useHaptics';
import { getLevelInfo } from '../src/engine/stats';
import { BattleViewMode, DifficultyLevel } from '../src/types/game';
import { saveLanguage } from '../src/i18n';
import { setTutorialSeen } from '../src/storage/scores';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

function ToggleOption({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityLabel={`${label}. ${description}`}
      accessibilityState={{ checked: selected }}
    >
      <View style={styles.optionRow}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
        <View style={styles.optionText}>
          <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
            {label}
          </Text>
          <Text style={styles.optionDesc}>{description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const LANGUAGES = [
  { code: 'pt-BR', label: 'Portugues' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { settings, update } = useSettings();
  const { stats } = usePlayerStats();
  const haptics = useHaptics();
  const level = getLevelInfo(stats.totalXP);

  const handleBattleView = (mode: BattleViewMode) => {
    haptics.light();
    update({ ...settings, battleView: mode });
  };

  const handleDifficulty = (level: DifficultyLevel) => {
    haptics.light();
    update({ ...settings, difficulty: level });
  };

  const handleLanguage = (code: string) => {
    haptics.light();
    i18n.changeLanguage(code);
    saveLanguage(code);
  };

  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title')}</Text>
          <View style={styles.divider} />
        </View>

        <ScrollView style={styles.sections} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.gridFleet')}</Text>
            <View style={styles.readOnlyCard}>
              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyLabel}>{t('settings.rank')}</Text>
                <Text style={styles.readOnlyValue}>{t('ranks.' + level.rank).toUpperCase()}</Text>
              </View>
              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyLabel}>{t('settings.grid')}</Text>
                <Text style={styles.readOnlyValue}>{level.gridSize}x{level.gridSize}</Text>
              </View>
              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyLabel}>{t('settings.fleet')}</Text>
                <Text style={styles.readOnlyValue}>
                  {level.ships.map(s => `${t('ships.' + s.name)}(${s.size})`).join(', ')}
                </Text>
              </View>
              <Text style={styles.readOnlyHint}>{t('settings.gridHint')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.battleView')}</Text>
            <ToggleOption
              label={t('settings.stacked')}
              description={t('settings.stackedDesc')}
              selected={settings.battleView === 'stacked'}
              onPress={() => handleBattleView('stacked')}
            />
            <ToggleOption
              label={t('settings.swipe')}
              description={t('settings.swipeDesc')}
              selected={settings.battleView === 'swipe'}
              onPress={() => handleBattleView('swipe')}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.difficulty')}</Text>
            <ToggleOption
              label={t('settings.easy')}
              description={t('settings.easyDesc')}
              selected={settings.difficulty === 'easy'}
              onPress={() => handleDifficulty('easy')}
            />
            <ToggleOption
              label={t('settings.normal')}
              description={t('settings.normalDesc')}
              selected={settings.difficulty === 'normal'}
              onPress={() => handleDifficulty('normal')}
            />
            <ToggleOption
              label={t('settings.hard')}
              description={t('settings.hardDesc')}
              selected={settings.difficulty === 'hard'}
              onPress={() => handleDifficulty('hard')}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('tutorial.title').replace('\n', ' ')}</Text>
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                haptics.light();
                setTutorialSeen(false);
                router.push('/tutorial');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{t('settings.reviewTutorial')}</Text>
                <Text style={styles.optionDesc}>{t('settings.reviewTutorialDesc')}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.option, i18n.language === lang.code && styles.optionSelected]}
                onPress={() => handleLanguage(lang.code)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityLabel={lang.label}
                accessibilityState={{ checked: i18n.language === lang.code }}
              >
                <View style={styles.optionRow}>
                  <View style={[styles.radio, i18n.language === lang.code && styles.radioSelected]}>
                    {i18n.language === lang.code && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.optionLabel, i18n.language === lang.code && styles.optionLabelSelected]}>
                    {lang.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <NavalButton
            title={t('settings.backToBase')}
            onPress={() => {
              haptics.light();
              router.back();
            }}
            variant="secondary"
          />
        </View>
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
    marginTop: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.text.accent,
    letterSpacing: 4,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.accent.gold,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  sections: {
    flex: 1,
    marginTop: SPACING.md,
  },
  section: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  option: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.surface.subtle,
  },
  optionSelected: {
    borderColor: COLORS.accent.gold,
    backgroundColor: COLORS.overlay.goldSoft,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.grid.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.accent.gold,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent.gold,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  optionLabelSelected: {
    color: COLORS.accent.gold,
  },
  optionDesc: {
    fontFamily: FONTS.bodyLight,
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  readOnlyCard: {
    borderWidth: 1,
    borderColor: COLORS.accent.gold,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.overlay.goldSoft,
    gap: SPACING.sm,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readOnlyLabel: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  readOnlyValue: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.accent.gold,
    flexShrink: 1,
    textAlign: 'right',
  },
  readOnlyHint: {
    fontFamily: FONTS.bodyLight,
    fontSize: 10,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  actions: {
    marginTop: 'auto',
  },
});
