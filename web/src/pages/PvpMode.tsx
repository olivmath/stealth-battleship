import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/UI/PageShell';
import { StatusFeedback } from '../components/UI/StatusFeedback';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { NavalText } from '../components/UI/NavalText';
import { PinModal } from '../components/UI/PinModal';
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
  const [connecting, setConnecting] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [paymentError, setPaymentError] = useState('');
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [pinError, setPinError] = useState(false);
  const [battleBalance, setBattleBalance] = useState<string | null>(null);
  const [stellarAddress, setStellarAddress] = useState<string | null>(null);

  useEffect(() => {
    walletInteractor().then(m => m.hasWallet()).then(exists => {
      if (!exists) {
        // No wallet — redirect to login to create one
        navigate('/', { replace: true });
      } else {
        setWalletExists(true);
      }
    });
  }, []);

  // Payment step: memo-based flow — request memo, send payment with trustline, poll for token
  const handlePayment = async (secret: string) => {
    setPaymentState('paying');
    setPaymentError('');
    try {
      const { sendPaymentWithTrustline, getPublicKey } = await walletInteractor();
      const publicKey = await getPublicKey();
      if (!publicKey) throw new Error('No public key found');

      // 1. Get server address + fee
      const addrRes = await fetch(`${API_URL}/api/payment/address`);
      if (!addrRes.ok) throw new Error('Failed to fetch server address');
      const { address, feeXlm, assetCode } = await addrRes.json();

      // 2. Request memo from server
      const memoRes = await fetch(`${API_URL}/api/payment/memo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerPk: publicKey }),
      });
      if (!memoRes.ok) throw new Error('Failed to get payment memo');
      const { memo } = await memoRes.json();

      // 3. Send payment with trustline + memo in atomic tx
      await sendPaymentWithTrustline(secret, address, feeXlm, memo, assetCode || 'BATTLE');

      // 4. Poll for token confirmation
      const pollForToken = async (): Promise<boolean> => {
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const statusRes = await fetch(`${API_URL}/api/payment/status/${publicKey}`);
          if (!statusRes.ok) continue;
          const statusData = await statusRes.json();
          if (statusData.hasToken) return true;
        }
        return false;
      };

      const hasToken = await pollForToken();
      if (!hasToken) throw new Error('Payment confirmation timed out');

      setPaymentState('paid');
      setBattleBalance('1');
      // Now connect to PvP
      pvp.connectWithSecret(secret);
    } catch (e: any) {
      setPaymentState('error');
      setPaymentError(e.message || 'Payment failed');
    }
  };

  // Unlock wallet with PIN — then check if player already has BATTLE token
  const handleUnlock = async (pinValue: string) => {
    setConnecting(true);
    try {
      const { getSecretKey: getSK, getPublicKey } = await walletInteractor();
      const secret = await getSK(pinValue);
      setSecretKey(secret);

      // Check if player already has a BATTLE token — skip payment if so
      const publicKey = await getPublicKey();
      if (publicKey) {
        setStellarAddress(publicKey);
        const [statusRes, addrRes] = await Promise.all([
          fetch(`${API_URL}/api/payment/status/${publicKey}`),
          fetch(`${API_URL}/api/payment/address`),
        ]);
        if (statusRes.ok) {
          const { hasToken } = await statusRes.json();
          if (hasToken) {
            setPaymentState('paid');
            pvp.connectWithSecret(secret);
          }
        }
        // Fetch BATTLE token balance
        if (addrRes.ok) {
          const { address } = await addrRes.json();
          const { getBattleTokenBalance } = await walletInteractor();
          const bal = await getBattleTokenBalance(publicKey, address);
          setBattleBalance(bal);
        }
      }
      setConnecting(false);
    } catch {
      setPinError(true);
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
              {battleBalance !== null && (
                <span style={styles.battleChip}>
                  {parseInt(battleBalance)} BATTLE
                </span>
              )}
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
        {connecting ? (
          <div style={styles.pinSection}>
            <RadarSpinner size={40} />
          </div>
        ) : (
          <PinModal
            visible={true}
            title={t('wallet.view.enterPin', 'Enter PIN')}
            error={pinError}
            onSubmit={handleUnlock}
            onCancel={() => {
              setPinError(false);
              navigate('/menu', { replace: true });
            }}
          />
        )}
      </PageShell>
    );
  }

  // Connected — show mode selection
  return (
    <PageShell
      title={t('pvpMode.title')}
      subtitle={t('pvpMode.subtitle')}
      headerExtra={
        <div style={styles.headerInfo}>
          {stellarAddress && (
            <NavalText variant="bodyLight" style={{ fontSize: 12, letterSpacing: 1 }}>
              {stellarAddress.slice(0, 8)}...{stellarAddress.slice(-8)}
            </NavalText>
          )}
          {battleBalance !== null && (
            <span style={styles.battleChip}>
              {parseInt(battleBalance)} BATTLE
            </span>
          )}
        </div>
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
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.accent.fire,
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  battleChip: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.status.pvp,
    letterSpacing: 1,
    border: `1px solid ${COLORS.status.pvp}`,
    borderRadius: 4,
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.sm,
    paddingTop: 2,
    paddingBottom: 2,
  },
};
