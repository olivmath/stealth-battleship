import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { PinModal } from '../components/UI/PinModal';
import { NavalText } from '../components/UI/NavalText';
import { Divider } from '../components/UI/Divider';
import { useGame } from '../game/translator';
import { useHaptics } from '../hooks/useHaptics';
import { getPlayerName, savePlayerName } from '../game/adapter';
import { hasWallet, getSecretKey } from '../wallet/interactor';
import { COLORS, FONTS, SPACING, RADIUS } from '../shared/theme';

export default function Login() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const haptics = useHaptics();

  useEffect(() => {
    getPlayerName().then(async (saved) => {
      if (saved) {
        dispatch({ type: 'SET_PLAYER', name: saved });
        const walletExists = await hasWallet();
        if (walletExists) {
          setShowPin(true);
          setLoading(false);
        } else {
          navigate('/wallet-setup', { replace: true });
        }
        return;
      }
      setLoading(false);
    });
  }, []);

  const handleEnter = async () => {
    if (!name.trim()) return;
    haptics.light();
    await savePlayerName(name.trim());
    dispatch({ type: 'SET_PLAYER', name: name.trim() });
    navigate('/wallet-setup', { replace: true });
  };

  const handlePinSuccess = async (pin: string) => {
    try {
      setPinError(false);
      await getSecretKey(pin);
      setShowPin(false);
      haptics.success();
      navigate('/menu', { replace: true });
    } catch {
      haptics.error();
      setPinError(true);
    }
  };

  if (loading && !showPin) return (
    <GradientContainer>
      <div style={styles.loadingContainer}>
        <RadarSpinner size={50} />
      </div>
    </GradientContainer>
  );

  if (showPin) return (
    <GradientContainer>
      <div style={styles.loadingContainer}>
        <PinModal
          visible={true}
          title={t('wallet.view.enterPin', 'Enter PIN')}
          error={pinError}
          onSubmit={handlePinSuccess}
          onCancel={() => {
            setShowPin(false);
            setLoading(false);
          }}
        />
      </div>
    </GradientContainer>
  );

  return (
    <GradientContainer>
      <div style={styles.container}>
        <div style={styles.header}>
          <NavalText variant="h1">{t('login.title')}</NavalText>
          <NavalText variant="bodyLight" letterSpacing={6} style={{ marginTop: SPACING.xs }}>{t('login.subtitle')}</NavalText>
          <Divider width={60} style={{ marginTop: SPACING.md }} />
        </div>

        <div style={styles.form}>
          <span style={styles.label}>{t('login.label')}</span>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('login.placeholder')}
            aria-label="Commander name"
            onKeyDown={(e) => { if (e.key === 'Enter') handleEnter(); }}
            autoCapitalize="words"
          />
          <NavalButton
            title={t('login.button')}
            onPress={handleEnter}
            disabled={!name.trim()}
            style={styles.button}
          />
        </div>

        <span style={styles.version}>{t('login.version')}</span>
      </div>
    </GradientContainer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.md,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.text.primary,
    border: `1px solid ${COLORS.grid.border}`,
    borderRadius: RADIUS.default,
    padding: SPACING.md,
    backgroundColor: COLORS.surface.cardBorder,
    outline: 'none',
  },
  button: {
    marginTop: SPACING.sm,
  },
  version: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.xxl,
    opacity: 0.5,
  },
};
