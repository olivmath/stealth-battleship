import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/UI/PageShell';
import { StatusFeedback } from '../components/UI/StatusFeedback';
import { NavalButton } from '../components/UI/NavalButton';
import { PinModal } from '../components/UI/PinModal';
import { useHaptics } from '../hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../shared/theme';
const walletInteractor = () => import('../wallet/interactor');

export default function WalletSetup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [tempPin, setTempPin] = useState('');

  // Reset after pin mismatch error
  useEffect(() => {
    if (pinError) {
      const timer = setTimeout(() => {
        setPinError(false);
        setPinStep('enter');
        setTempPin('');
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [pinError]);

  const handleCreate = async (pinValue: string) => {
    setLoading(true);
    setError('');
    try {
      const { createWallet } = await walletInteractor();
      await createWallet(pinValue);
      haptics.success();
      navigate('/menu', { replace: true });
    } catch (e: any) {
      setError(e.message || t('wallet.setup.errorGeneric'));
      setLoading(false);
    }
  };

  const handlePinSubmit = (enteredPin: string) => {
    if (pinStep === 'enter') {
      setTempPin(enteredPin);
      setPinStep('confirm');
      setPinError(false);
    } else {
      if (enteredPin === tempPin) {
        handleCreate(enteredPin);
      } else {
        setPinError(true);
      }
    }
  };

  if (loading) {
    return (
      <PageShell hideHeader>
        <StatusFeedback status="loading" message={t('wallet.setup.generating')} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t('wallet.setup.createTitle')}
      subtitle={t('wallet.setup.subtitle')}
      accentColor={COLORS.status.pvp}
      actions={
        <NavalButton
          title={t('wallet.setup.back')}
          variant="ghost"
          size="small"
          onPress={() => navigate(-1)}
        />
      }
    >
      <PinModal
        key={pinStep}
        visible={true}
        title={pinStep === 'enter'
          ? t('wallet.setup.pinLabel')
          : t('wallet.setup.pinConfirmLabel')}
        error={pinError}
        onSubmit={handlePinSubmit}
        onCancel={() => navigate(-1)}
      />
      {error !== '' && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
    </PageShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  errorText: {
    fontFamily: FONTS.bodyLight,
    fontSize: 12,
    color: COLORS.text.danger,
    letterSpacing: 1,
  },
};
