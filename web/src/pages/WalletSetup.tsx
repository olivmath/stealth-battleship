import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { useHaptics } from '../hooks/useHaptics';
import { COLORS, FONTS, SPACING, LAYOUT } from '../shared/theme';
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
      <GradientContainer>
        <div style={styles.center}>
          <RadarSpinner size={50} />
          <span style={styles.loadingText}>{t('wallet.setup.generating')}</span>
        </div>
      </GradientContainer>
    );
  }

  return (
    <GradientContainer>
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>{t('wallet.setup.createTitle')}</span>
          <span style={styles.subtitle}>{t('wallet.setup.subtitle')}</span>
          <div style={styles.divider} />
        </div>

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
          <NavalButton
            title={t('wallet.setup.back')}
            variant="secondary"
            size="small"
            onPress={() => navigate(-1)}
          />
        </div>
      </div>
    </GradientContainer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    boxSizing: 'border-box' as const,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    boxSizing: 'border-box' as const,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: COLORS.status.pvp,
    letterSpacing: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.headingLight,
    fontSize: 12,
    color: COLORS.text.secondary,
    letterSpacing: 4,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.status.pvp,
    marginTop: SPACING.md,
    opacity: 0.6,
  },
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
    outline: 'none',
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
