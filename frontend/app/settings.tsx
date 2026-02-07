import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import { useSettings } from '../src/hooks/useStorage';
import { useHaptics } from '../src/hooks/useHaptics';
import { GridSizeOption, BattleViewMode, DifficultyLevel } from '../src/types/game';
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

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const haptics = useHaptics();

  const handleGridSize = (size: GridSizeOption) => {
    haptics.light();
    update({ ...settings, gridSize: size });
  };

  const handleBattleView = (mode: BattleViewMode) => {
    haptics.light();
    update({ ...settings, battleView: mode });
  };

  const handleDifficulty = (level: DifficultyLevel) => {
    haptics.light();
    update({ ...settings, difficulty: level });
  };

  return (
    <GradientContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SETTINGS</Text>
          <View style={styles.divider} />
        </View>

        <ScrollView style={styles.sections} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GRID SIZE</Text>
            <ToggleOption
              label="COMPACT 6x6"
              description="3 ships • Quick matches (~3 min)"
              selected={settings.gridSize === 6}
              onPress={() => handleGridSize(6)}
            />
            <ToggleOption
              label="CLASSIC 10x10"
              description="5 ships • Full battles (~8 min)"
              selected={settings.gridSize === 10}
              onPress={() => handleGridSize(10)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BATTLE VIEW</Text>
            <ToggleOption
              label="STACKED"
              description="Both boards visible simultaneously"
              selected={settings.battleView === 'stacked'}
              onPress={() => handleBattleView('stacked')}
            />
            <ToggleOption
              label="SWIPE"
              description="Full-size board, swipe to switch"
              selected={settings.battleView === 'swipe'}
              onPress={() => handleBattleView('swipe')}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DIFFICULTY</Text>
            <ToggleOption
              label="EASY"
              description="Relaxed AI • 0.5x XP"
              selected={settings.difficulty === 'easy'}
              onPress={() => handleDifficulty('easy')}
            />
            <ToggleOption
              label="NORMAL"
              description="Standard AI • 1x XP"
              selected={settings.difficulty === 'normal'}
              onPress={() => handleDifficulty('normal')}
            />
            <ToggleOption
              label="HARD"
              description="Aggressive AI • 1.5x XP"
              selected={settings.difficulty === 'hard'}
              onPress={() => handleDifficulty('hard')}
            />
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <NavalButton
            title="BACK TO BASE"
            onPress={() => {
              haptics.light();
              router.replace('/menu');
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
    backgroundColor: 'rgba(30, 58, 95, 0.15)',
  },
  optionSelected: {
    borderColor: COLORS.accent.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
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
  actions: {
    marginTop: 'auto',
  },
});
