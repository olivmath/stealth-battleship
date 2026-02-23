import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/UI/PageShell';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { PinModal } from '../components/UI/PinModal';
import { useGame } from '../game/translator';
import { useHaptics } from '../hooks/useHaptics';
import { getPlayerName, savePlayerName } from '../game/adapter';
import { hasWallet, getSecretKey, createWallet } from '../wallet/interactor';
import { COLORS, FONTS, SPACING, RADIUS, LAYOUT } from '../shared/theme';

type LoginPhase = 'loading' | 'nameEntry' | 'createPin' | 'confirmPin' | 'creatingWallet' | 'unlockPin';

export default function Login() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<LoginPhase>('loading');
  const [pinError, setPinError] = useState(false);
  const [tempPin, setTempPin] = useState('');
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const haptics = useHaptics();

  useEffect(() => {
    getPlayerName().then(async (saved) => {
      if (saved) {
        dispatch({ type: 'SET_PLAYER', name: saved });
        const walletExists = await hasWallet();
        if (walletExists) {
          setPhase('unlockPin');
        } else {
          // Has name but no wallet (edge case / migration)
          setName(saved);
          setPhase('createPin');
        }
        return;
      }
      setPhase('nameEntry');
    });
  }, []);

  // Reset create flow after pin mismatch
  useEffect(() => {
    if (pinError && phase === 'confirmPin') {
      const timer = setTimeout(() => {
        setPinError(false);
        setTempPin('');
        setPhase('createPin');
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [pinError, phase]);

  const handleEnter = async () => {
    if (!name.trim()) return;
    haptics.light();
    setPhase('createPin');
  };

  // Returning user: unlock existing wallet
  const handleUnlockPin = async (pin: string) => {
    try {
      setPinError(false);
      await getSecretKey(pin);
      haptics.success();
      navigate('/menu', { replace: true });
    } catch {
      haptics.error();
      setPinError(true);
    }
  };

  // New user: two-step PIN creation
  const handleCreatePinSubmit = async (enteredPin: string) => {
    if (phase === 'createPin') {
      setTempPin(enteredPin);
      setPinError(false);
      setPhase('confirmPin');
    } else if (phase === 'confirmPin') {
      if (enteredPin === tempPin) {
        setPhase('creatingWallet');
        setAuthError('');
        try {
          await savePlayerName(name.trim());
          dispatch({ type: 'SET_PLAYER', name: name.trim() });
          await createWallet(enteredPin);
          haptics.success();
          navigate('/menu', { replace: true });
        } catch (e: any) {
          setAuthError(e.message || 'Error creating wallet');
          setPhase('createPin');
          setTempPin('');
        }
      } else {
        haptics.error();
        setPinError(true);
      }
    }
  };

  if (phase === 'loading') return (
    <PageShell hideHeader>
      <div style={styles.loadingContainer}>
        <RadarSpinner size={50} />
      </div>
    </PageShell>
  );

  if (phase === 'unlockPin') return (
    <PageShell hideHeader>
      <div style={styles.loadingContainer}>
        <PinModal
          visible={true}
          title={t('wallet.view.enterPin', 'Enter PIN')}
          error={pinError}
          onSubmit={handleUnlockPin}
          onCancel={() => {
            setPinError(false);
            setPhase('nameEntry');
          }}
        />
      </div>
    </PageShell>
  );

  if (phase === 'createPin' || phase === 'confirmPin') return (
    <PageShell
      title={t('login.title')}
      subtitle={name.trim() ? t('pvpMode.createPinPrompt', 'Create a PIN to generate your wallet') : undefined}
    >
      {authError && <span style={styles.errorText}>{authError}</span>}
      <PinModal
        key={phase}
        visible={true}
        title={phase === 'createPin'
          ? t('pvpMode.pinLabel', 'PIN (4 digits)')
          : t('pvpMode.pinConfirmLabel', 'CONFIRM PIN')}
        error={pinError}
        onSubmit={handleCreatePinSubmit}
        onCancel={() => {
          setPinError(false);
          setTempPin('');
          setPhase('nameEntry');
        }}
      />
    </PageShell>
  );

  if (phase === 'creatingWallet') return (
    <PageShell hideHeader>
      <div style={styles.loadingContainer}>
        <RadarSpinner size={50} />
      </div>
    </PageShell>
  );

  return (
    <PageShell title={t('login.title')} subtitle={t('login.subtitle')}>
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
    </PageShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.accent.fire,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
};
