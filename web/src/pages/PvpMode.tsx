import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { NavalText } from '../components/UI/NavalText';
import { usePvP } from '../pvp/translator';
import { useHaptics } from '../hooks/useHaptics';
// Dynamic import to avoid eager crypto.subtle access
const walletInteractor = () => import('../wallet/interactor');
import { COLORS, FONTS, SPACING, LAYOUT } from '../shared/theme';

export default function PvpMode() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const pvp = usePvP();
  const [walletExists, setWalletExists] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    walletInteractor().then(m => m.hasWallet()).then(setWalletExists);
  }, []);

  const pinValid = pin.length === 4 && /^\d{4}$/.test(pin);
  const pinsMatch = pin === pinConfirm;

  // Wallet exists: unlock with PIN
  const handleUnlock = async () => {
    if (!pin) return;
    setConnecting(true);
    setAuthError('');
    try {
      const { getSecretKey } = await walletInteractor();
      const secret = await getSecretKey(pin);
      pvp.connectWithSecret(secret);
    } catch {
      setAuthError(t('pvpMode.invalidPin', 'Invalid PIN'));
      setConnecting(false);
      return;
    }
    setConnecting(false);
  };

  // No wallet: create with PIN
  const handleCreate = async () => {
    if (!pinValid || !pinsMatch) return;
    setConnecting(true);
    setAuthError('');
    try {
      const { createWallet, getSecretKey } = await walletInteractor();
      await createWallet(pin);
      const secret = await getSecretKey(pin);
      setWalletExists(true);
      pvp.connectWithSecret(secret);
    } catch (e: any) {
      setAuthError(e.message || t('pvpMode.errorCreating', 'Error creating wallet'));
      setConnecting(false);
      return;
    }
    setConnecting(false);
  };

  // If already connected, show mode selection
  const isConnected = pvp.myPublicKeyHex !== null;

  // Loading wallet check
  if (walletExists === null) {
    return (
      <GradientContainer>
        <div style={styles.container}>
          <RadarSpinner size={60} />
        </div>
      </GradientContainer>
    );
  }

  // No wallet — create PIN flow
  if (!walletExists) {
    return (
      <GradientContainer>
        <div style={styles.container}>
          <div style={styles.header}>
            <span style={styles.title}>{t('pvpMode.title')}</span>
            <NavalText variant="bodyLight" style={{ textAlign: 'center', marginTop: SPACING.sm }}>
              {t('pvpMode.createPinPrompt', 'Create a PIN to generate your wallet')}
            </NavalText>
            <div style={styles.divider} />
          </div>

          <div style={styles.pinSection}>
            <span style={styles.pinLabel}>{t('pvpMode.pinLabel', 'PIN (4 digits)')}</span>
            <input
              style={styles.pinInput}
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="····"
              maxLength={4}
              inputMode="numeric"
              disabled={connecting}
            />

            <span style={styles.pinLabel}>{t('pvpMode.pinConfirmLabel', 'CONFIRM PIN')}</span>
            <input
              style={styles.pinInput}
              type="password"
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="····"
              maxLength={4}
              inputMode="numeric"
              disabled={connecting}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            />

            {pin.length > 0 && pin.length < 4 && (
              <span style={styles.errorText}>{t('pvpMode.pinInvalid', 'PIN must be 4 digits')}</span>
            )}
            {pinConfirm.length > 0 && !pinsMatch && (
              <span style={styles.errorText}>{t('pvpMode.pinMismatch', 'PINs do not match')}</span>
            )}
            {authError && <span style={styles.errorText}>{authError}</span>}

            {connecting ? (
              <RadarSpinner size={40} />
            ) : (
              <NavalButton
                title={t('pvpMode.createWallet', 'Create Wallet')}
                variant="pvp"
                onPress={handleCreate}
                disabled={!pinValid || !pinsMatch}
              />
            )}
          </div>

          <NavalButton
            title={t('pvpMode.back')}
            variant="danger"
            size="small"
            onPress={() => navigate('/menu', { replace: true })}
          />
        </div>
      </GradientContainer>
    );
  }

  // Wallet exists but not connected — enter PIN to unlock
  if (!isConnected) {
    return (
      <GradientContainer>
        <div style={styles.container}>
          <div style={styles.header}>
            <span style={styles.title}>{t('pvpMode.title')}</span>
            <NavalText variant="bodyLight" style={{ textAlign: 'center', marginTop: SPACING.sm }}>
              {t('pvpMode.enterPinPrompt', 'Enter your PIN to connect')}
            </NavalText>
            <div style={styles.divider} />
          </div>

          <div style={styles.pinSection}>
            <input
              style={styles.pinInput}
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="····"
              maxLength={4}
              inputMode="numeric"
              disabled={connecting}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
            />
            {authError && <span style={styles.errorText}>{authError}</span>}
            {connecting ? (
              <RadarSpinner size={40} />
            ) : (
              <NavalButton
                title={t('pvpMode.connect', 'Connect')}
                variant="pvp"
                onPress={handleUnlock}
                disabled={!pin}
              />
            )}
          </div>

          <NavalButton
            title={t('pvpMode.back')}
            variant="danger"
            size="small"
            onPress={() => navigate('/menu', { replace: true })}
          />
        </div>
      </GradientContainer>
    );
  }

  // Connected — show mode selection
  return (
    <GradientContainer>
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>{t('pvpMode.title')}</span>
          <span style={styles.subtitle}>{t('pvpMode.subtitle')}</span>
          <NavalText variant="bodyLight" style={{ fontSize: 10, marginTop: 4 }}>
            {pvp.myPublicKeyHex?.slice(0, 12)}...
          </NavalText>
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
            pvp.reset();
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
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    boxSizing: 'border-box' as const,
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
  pinSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.md,
  },
  pinLabel: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  pinInput: {
    width: 200,
    border: `1.5px solid ${COLORS.accent.gold}`,
    backgroundColor: COLORS.overlay.darkPanel,
    borderRadius: 4,
    padding: `${SPACING.md}px ${SPACING.lg}px`,
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.accent.gold,
    textAlign: 'center' as const,
    letterSpacing: 6,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.accent.fire,
  },
};
