import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/UI/PageShell';
import { StatusFeedback } from '../components/UI/StatusFeedback';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { NavalText } from '../components/UI/NavalText';
import { usePvP } from '../pvp/translator';
import { useHaptics } from '../hooks/useHaptics';
// Dynamic import to avoid eager crypto.subtle access
const walletInteractor = () => import('../wallet/interactor');
import { COLORS, FONTS, SPACING } from '../shared/theme';

const API_URL = import.meta.env.VITE_ZK_SERVER_URL || 'http://localhost:3001';

type PaymentState = 'idle' | 'paying' | 'paid' | 'error';

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
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [paymentError, setPaymentError] = useState('');
  const [secretKey, setSecretKey] = useState<string | null>(null);

  useEffect(() => {
    walletInteractor().then(m => m.hasWallet()).then(setWalletExists);
  }, []);

  const pinValid = pin.length === 4 && /^\d{4}$/.test(pin);
  const pinsMatch = pin === pinConfirm;

  // Payment step: send 0.001 XLM to server, verify, then connect
  const handlePayment = async (secret: string) => {
    setPaymentState('paying');
    setPaymentError('');
    try {
      // 1. Get server address
      const addrRes = await fetch(`${API_URL}/api/payment/address`);
      if (!addrRes.ok) throw new Error('Failed to fetch server address');
      const { address, feeXlm } = await addrRes.json();

      // 2. Send payment
      const { sendPayment, getPublicKey } = await walletInteractor();
      const txHash = await sendPayment(secret, address, feeXlm);
      const publicKey = await getPublicKey();

      // 3. Verify payment with backend
      const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash, playerPk: publicKey }),
      });
      const result = await verifyRes.json();
      if (!result.valid) throw new Error(result.error || 'Payment verification failed');

      setPaymentState('paid');
      // Now connect to PvP
      pvp.connectWithSecret(secret);
    } catch (e: any) {
      setPaymentState('error');
      setPaymentError(e.message || 'Payment failed');
    }
  };

  // Wallet exists: unlock with PIN
  const handleUnlock = async () => {
    if (!pin) return;
    setConnecting(true);
    setAuthError('');
    try {
      const { getSecretKey: getSK } = await walletInteractor();
      const secret = await getSK(pin);
      setSecretKey(secret);
      setConnecting(false);
    } catch {
      setAuthError(t('pvpMode.invalidPin', 'Invalid PIN'));
      setConnecting(false);
    }
  };

  // No wallet: create with PIN
  const handleCreate = async () => {
    if (!pinValid || !pinsMatch) return;
    setConnecting(true);
    setAuthError('');
    try {
      const { createWallet, getSecretKey: getSK } = await walletInteractor();
      await createWallet(pin);
      const secret = await getSK(pin);
      setWalletExists(true);
      setSecretKey(secret);
      setConnecting(false);
    } catch (e: any) {
      setAuthError(e.message || t('pvpMode.errorCreating', 'Error creating wallet'));
      setConnecting(false);
    }
  };

  // If already connected, show mode selection
  const isConnected = pvp.myPublicKeyHex !== null;
  // Wallet unlocked but not yet paid
  const needsPayment = secretKey !== null && !isConnected && paymentState !== 'paid';

  // Loading wallet check
  if (walletExists === null) {
    return (
      <PageShell hideHeader>
        <StatusFeedback status="loading" />
      </PageShell>
    );
  }

  // No wallet — create PIN flow
  if (!walletExists) {
    return (
      <PageShell
        title={t('pvpMode.title')}
        subtitle={t('pvpMode.createPinPrompt', 'Create a PIN to generate your wallet')}
        actions={
          <NavalButton
            title={t('pvpMode.back')}
            variant="ghost"
            size="small"
            onPress={() => navigate('/menu', { replace: true })}
          />
        }
      >
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
      </PageShell>
    );
  }

  // Wallet unlocked — payment step
  if (needsPayment) {
    return (
      <PageShell
        title={t('pvpMode.title')}
        subtitle={t('pvpMode.paymentPrompt', 'Pay 0.001 XLM to enter PvP')}
        actions={
          <NavalButton
            title={t('pvpMode.back')}
            variant="ghost"
            size="small"
            onPress={() => {
              setSecretKey(null);
              setPaymentState('idle');
              setPaymentError('');
              navigate('/menu', { replace: true });
            }}
          />
        }
      >
        <div style={styles.pinSection}>
          {paymentState === 'paying' ? (
            <>
              <NavalText variant="bodyLight">
                {t('pvpMode.paymentProcessing', 'Processing payment...')}
              </NavalText>
              <RadarSpinner size={40} />
            </>
          ) : paymentState === 'error' ? (
            <>
              <span style={styles.errorText}>{paymentError}</span>
              <NavalButton
                title={t('pvpMode.retryPayment', 'Retry Payment')}
                variant="pvp"
                onPress={() => handlePayment(secretKey)}
              />
            </>
          ) : (
            <>
              <NavalText variant="bodyLight" style={{ textAlign: 'center', marginBottom: 8 }}>
                {t('pvpMode.paymentInfo', 'A small fee of 0.001 XLM is required to play PvP matches.')}
              </NavalText>
              <NavalButton
                title={t('pvpMode.payAndPlay', 'Pay & Play')}
                variant="pvp"
                onPress={() => handlePayment(secretKey)}
              />
            </>
          )}
        </div>
      </PageShell>
    );
  }

  // Wallet exists but not connected — enter PIN to unlock
  if (!isConnected && !secretKey) {
    return (
      <PageShell
        title={t('pvpMode.title')}
        subtitle={t('pvpMode.enterPinPrompt', 'Enter your PIN to connect')}
        actions={
          <NavalButton
            title={t('pvpMode.back')}
            variant="ghost"
            size="small"
            onPress={() => navigate('/menu', { replace: true })}
          />
        }
      >
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
      </PageShell>
    );
  }

  // Connected — show mode selection
  return (
    <PageShell
      title={t('pvpMode.title')}
      subtitle={t('pvpMode.subtitle')}
      headerExtra={
        <NavalText variant="bodyLight" style={{ fontSize: 10, marginTop: 4 }}>
          {pvp.myPublicKeyHex?.slice(0, 12)}...
        </NavalText>
      }
      actions={
        <NavalButton
          title={t('pvpMode.back')}
          variant="ghost"
          size="small"
          onPress={() => {
            haptics.light();
            pvp.reset();
            navigate('/menu', { replace: true });
          }}
        />
      }
    >
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
    </PageShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
    boxSizing: 'border-box' as const,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.accent.fire,
  },
};
