import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { useHaptics } from '../hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../shared/theme';

export default function PvpMode() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();

  return (
    <GradientContainer>
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>{t('pvpMode.title')}</span>
          <span style={styles.subtitle}>{t('pvpMode.subtitle')}</span>
          <div style={styles.divider} />
        </div>

        <div style={styles.options}>
          <NavalButton
            title={t('pvpMode.random')}
            subtitle={t('pvpMode.randomSub')}
            variant="pvp"
            onPress={() => {
              haptics.light();
              navigate('/pvp-lobby', { replace: true });
            }}
          />
          <NavalButton
            title={t('pvpMode.friend')}
            subtitle={t('pvpMode.friendSub')}
            variant="pvp"
            onPress={() => {
              haptics.light();
              navigate('/pvp-friend', { replace: true });
            }}
          />
        </div>

        <NavalButton
          title={t('pvpMode.back')}
          variant="danger"
          size="small"
          onPress={() => {
            haptics.light();
            navigate('/menu', { replace: true });
          }}
        />
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
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.md,
  },
};
