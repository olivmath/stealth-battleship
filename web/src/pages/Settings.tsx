import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { usePlayerStats } from '../stats/translator';
import { useSettings } from '../settings/translator';
import { useHaptics } from '../hooks/useHaptics';
import { getLevelInfo } from '../stats/interactor';
import { saveLanguage } from '../i18n';
import { setTutorialSeen } from '../settings/interactor';
import { COLORS, FONTS, SPACING } from '../shared/theme';

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
    <button
      style={{ ...styles.option, ...(selected ? styles.optionSelected : {}) }}
      onClick={onPress}
      role="radio"
      aria-checked={selected}
      aria-label={`${label}. ${description}`}
    >
      <div style={styles.optionRow}>
        <div style={{ ...styles.radio, ...(selected ? styles.radioSelected : {}) }}>
          {selected && <div style={styles.radioInner} />}
        </div>
        <div style={styles.optionText}>
          <span style={{ ...styles.optionLabel, ...(selected ? styles.optionLabelSelected : {}) }}>
            {label}
          </span>
          <span style={styles.optionDesc}>{description}</span>
        </div>
      </div>
    </button>
  );
}

const LANGUAGES = [
  { code: 'pt-BR', label: 'Portugues' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
] as const;

export default function Settings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { settings, update } = useSettings();
  const { stats } = usePlayerStats();
  const haptics = useHaptics();
  const level = getLevelInfo(stats.totalXP);

  const handleLanguage = (code: string) => {
    haptics.light();
    i18n.changeLanguage(code);
    saveLanguage(code);
  };

  return (
    <GradientContainer>
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>{t('settings.title')}</span>
          <div style={styles.divider} />
        </div>

        <div style={styles.sections}>
          <div style={styles.section}>
            <span style={styles.sectionTitle}>{t('settings.gridFleet')}</span>
            <div style={styles.readOnlyCard}>
              <div style={styles.readOnlyRow}>
                <span style={styles.readOnlyLabel}>{t('settings.rank')}</span>
                <span style={styles.readOnlyValue}>{t('ranks.' + level.rank).toUpperCase()}</span>
              </div>
              <div style={styles.readOnlyRow}>
                <span style={styles.readOnlyLabel}>{t('settings.grid')}</span>
                <span style={styles.readOnlyValue}>{level.gridSize}x{level.gridSize}</span>
              </div>
              <div style={styles.readOnlyRow}>
                <span style={styles.readOnlyLabel}>{t('settings.fleet')}</span>
                <span style={styles.readOnlyValue}>
                  {level.ships.map(s => `${t('ships.' + s.name)}(${s.size})`).join(', ')}
                </span>
              </div>
              <span style={styles.readOnlyHint}>{t('settings.gridHint')}</span>
            </div>
          </div>

          <div style={styles.section}>
            <span style={styles.sectionTitle}>{t('tutorial.title').replace('\n', ' ')}</span>
            <button
              style={styles.option}
              onClick={() => {
                haptics.light();
                setTutorialSeen(false);
                navigate('/tutorial');
              }}
            >
              <div style={styles.optionText}>
                <span style={styles.optionLabel}>{t('settings.reviewTutorial')}</span>
                <span style={styles.optionDesc}>{t('settings.reviewTutorialDesc')}</span>
              </div>
            </button>
          </div>

          <div style={styles.section}>
            <span style={styles.sectionTitle}>{t('settings.language')}</span>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                style={{ ...styles.option, ...(i18n.language === lang.code ? styles.optionSelected : {}) }}
                onClick={() => handleLanguage(lang.code)}
                role="radio"
                aria-checked={i18n.language === lang.code}
                aria-label={lang.label}
              >
                <div style={styles.optionRow}>
                  <div style={{ ...styles.radio, ...(i18n.language === lang.code ? styles.radioSelected : {}) }}>
                    {i18n.language === lang.code && <div style={styles.radioInner} />}
                  </div>
                  <span style={{ ...styles.optionLabel, ...(i18n.language === lang.code ? styles.optionLabelSelected : {}) }}>
                    {lang.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.actions}>
          <NavalButton
            title={t('settings.backToBase')}
            onPress={() => {
              haptics.light();
              navigate(-1);
            }}
            variant="secondary"
          />
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
    justifyContent: 'space-between',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
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
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
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
    border: `1px solid ${COLORS.grid.border}`,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.surface.subtle,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    display: 'block',
  },
  optionSelected: {
    borderColor: COLORS.accent.gold,
    backgroundColor: COLORS.overlay.goldSoft,
  },
  optionRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    border: `2px solid ${COLORS.grid.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
    display: 'flex',
    flexDirection: 'column',
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
    border: `1px solid ${COLORS.accent.gold}`,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.overlay.goldSoft,
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  readOnlyRow: {
    display: 'flex',
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
};
