import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/UI/PageShell';
import { StatusFeedback } from '../components/UI/StatusFeedback';
import { NavalButton } from '../components/UI/NavalButton';
import { useHaptics } from '../hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../shared/theme';
const walletInteractor = () => import('../wallet/interactor');

export default function WalletSetup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();

  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const pinConfirmRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pinValid = pin.length === 4 && /^\d{4}$/.test(pin);
  const pinsMatch = pin === pinConfirm;

  const handleCreate = async () => {
    if (!pinValid || !pinsMatch) return;
    setLoading(true);
    setError('');
    try {
      const { createWallet } = await walletInteractor();
      await createWallet(pin);
      haptics.success();
      navigate('/menu', { replace: true });
    } catch (e: any) {
      setError(e.message || t('wallet.setup.errorGeneric'));
      setLoading(false);
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
      <div style={styles.form}>
        <span style={styles.label}>{t('wallet.setup.pinLabel')}</span>
        <input
          style={styles.input}
          value={pin}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            setPin(digits.slice(0, 4));
            if (digits.length >= 4) {
              setTimeout(() => pinConfirmRef.current?.focus(), 50);
            }
          }}
          placeholder={t('wallet.setup.pinPlaceholder')}
          type="password"
          inputMode="numeric"
          maxLength={4}
        />

        <span style={styles.label}>{t('wallet.setup.pinConfirmLabel')}</span>
        <input
          ref={pinConfirmRef}
          style={styles.input}
          value={pinConfirm}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            setPinConfirm(digits.slice(0, 4));
          }}
          placeholder={t('wallet.setup.pinConfirmPlaceholder')}
          type="password"
          inputMode="numeric"
          maxLength={4}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
          }}
        />

        {pin.length > 0 && !pinValid && (
          <span style={styles.errorText}>{t('wallet.setup.pinInvalid')}</span>
        )}
        {pinConfirm.length > 0 && !pinsMatch && (
          <span style={styles.errorText}>{t('wallet.setup.pinMismatch')}</span>
        )}
        {error !== '' && <span style={styles.errorText}>{error}</span>}

        <NavalButton
          title={t('wallet.setup.createButton')}
          onPress={handleCreate}
          disabled={!pinValid || !pinsMatch}
          style={styles.submitButton}
        />
      </div>
    </PageShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.sm,
    alignItems: 'stretch',
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
    marginTop: SPACING.xs,
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.text.primary,
    border: `1px solid ${COLORS.grid.border}`,
    borderRadius: 4,
    padding: SPACING.md,
    backgroundColor: COLORS.surface.cardBorder,
  },
  errorText: {
    fontFamily: FONTS.bodyLight,
    fontSize: 12,
    color: COLORS.text.danger,
    letterSpacing: 1,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
};
