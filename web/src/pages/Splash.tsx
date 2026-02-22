import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { getPlayerName } from '../game/adapter';
import { COLORS, FONTS, SPACING } from '../shared/theme';

export default function Splash() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [subtitleOpacity, setSubtitleOpacity] = useState(0);
  const [splashDelay, setSplashDelay] = useState<number | null>(null);

  // Check if returning user for shorter splash
  useEffect(() => {
    getPlayerName().then(name => {
      setSplashDelay(name ? 1500 : 3000);
    });
  }, []);

  // Animate in
  useEffect(() => {
    const t1 = setTimeout(() => setTitleOpacity(1), 100);
    const t2 = setTimeout(() => setSubtitleOpacity(1), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Navigate after delay
  useEffect(() => {
    if (splashDelay === null) return;
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, splashDelay);
    return () => clearTimeout(timer);
  }, [splashDelay, navigate]);

  return (
    <GradientContainer>
      <div style={styles.container}>
        <div style={{ ...styles.header, opacity: titleOpacity, transition: 'opacity 0.8s cubic-bezier(0.33, 1, 0.68, 1)' }}>
          <span style={styles.title}>{t('splash.title')}</span>
          <div style={styles.divider} />
        </div>

        <div style={{ ...styles.center, opacity: subtitleOpacity, transition: 'opacity 0.6s cubic-bezier(0.33, 1, 0.68, 1)' }}>
          <span style={styles.subtitle}>{t('splash.subtitle')}</span>
          <div style={styles.spinnerWrap}>
            <RadarSpinner size={50} />
          </div>
          <span style={styles.loading}>{t('splash.loading')}</span>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 38,
    color: COLORS.text.accent,
    letterSpacing: 6,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: COLORS.accent.gold,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  subtitle: {
    fontFamily: FONTS.headingLight,
    fontSize: 14,
    color: COLORS.text.secondary,
    letterSpacing: 8,
  },
  spinnerWrap: {
    marginTop: SPACING.md,
  },
  loading: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.secondary,
    letterSpacing: 3,
    opacity: 0.6,
  },
};
