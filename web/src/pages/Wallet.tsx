import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { PageShell } from '../components/UI/PageShell';
import { NavalButton } from '../components/UI/NavalButton';
import { PinModal } from '../components/UI/PinModal';
import { useHaptics } from '../hooks/useHaptics';
import { COLORS, FONTS, SPACING } from '../shared/theme';
import { getPublicKey, getSecretKey, getBalance, getBattleTokenBalance } from '../wallet/interactor';

export default function Wallet() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();

  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [battleBalance, setBattleBalance] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [copied, setCopied] = useState<'address' | 'secret' | null>(null);

  const API_URL = import.meta.env.VITE_ZK_SERVER_URL || 'http://localhost:3001';

  useEffect(() => {
    getPublicKey().then(pk => {
      if (pk) {
        setPublicKey(pk);
        getBalance(pk).then(setBalance);
        // Fetch BATTLE token balance
        fetch(`${API_URL}/api/payment/address`)
          .then(r => r.json())
          .then(({ address }) => getBattleTokenBalance(pk, address))
          .then(setBattleBalance)
          .catch(() => setBattleBalance('0'));
      }
    });
  }, []);

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(publicKey);
    haptics.light();
    setCopied('address');
    setTimeout(() => setCopied(null), 2000);
  };

  const [pinError, setPinError] = useState(false);

  const handlePinSuccess = async (pin: string) => {
    try {
      setPinError(false);
      const secret = await getSecretKey(pin);
      setShowPin(false);
      setSecretKey(secret);
      haptics.success();
      setTimeout(() => setSecretKey(null), 30000);
    } catch {
      haptics.error();
      setPinError(true);
    }
  };

  const truncated = publicKey
    ? `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`
    : '';

  return (
    <PageShell
      title={t('wallet.view.title')}
      accentColor={COLORS.status.pvp}
      actions={
        <>
          <NavalButton
            title={t('wallet.view.viewSecret')}
            subtitle={t('wallet.view.viewSecretSub')}
            variant="danger"
            onPress={() => { haptics.light(); setShowPin(true); }}
          />
          <NavalButton
            title={t('wallet.view.back')}
            variant="secondary"
            onPress={() => navigate(-1)}
          />
        </>
      }
    >
      {/* Public Address */}
      <div style={styles.section}>
        <span style={styles.label}>{t('wallet.view.addressLabel')}</span>
        <div style={styles.qrContainer}>
          {publicKey !== '' && (
            <QRCodeSVG
              value={publicKey}
              size={160}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="H"
            />
          )}
        </div>
        <button onClick={handleCopyAddress} style={styles.addressRow}>
          <span style={styles.addressText}>{truncated}</span>
          <span style={{ ...styles.copyBadge, ...(copied === 'address' ? styles.copyBadgeCopied : {}) }}>
            <span style={{ ...styles.copyBadgeText, ...(copied === 'address' ? styles.copyBadgeTextCopied : {}) }}>
              {copied === 'address' ? t('wallet.view.copied') : t('wallet.view.tapToCopy')}
            </span>
          </span>
        </button>

        {/* Balance */}
        <div style={styles.balanceRow}>
          <span style={styles.balanceLabel}>{t('wallet.view.balance')}</span>
          <span style={styles.balanceValue}>
            {balance !== null ? `${parseFloat(balance).toFixed(2)} XLM` : '\u2014'}
          </span>
          <span style={styles.balanceNetwork}>TESTNET</span>
        </div>

        {/* BATTLE Token Balance */}
        <div style={styles.balanceRow}>
          <span style={styles.balanceLabel}>BATTLE TOKEN</span>
          <span style={styles.battleValue}>
            {battleBalance !== null ? `${parseInt(battleBalance)}` : '\u2014'}
          </span>
          <span style={styles.battleBadge}>PVP PASS</span>
        </div>
      </div>

      {/* Secret Key */}
      {secretKey && (
        <div style={styles.secretBox}>
          <div style={styles.secretHeader}>
            <span style={styles.label}>{t('wallet.view.secretLabel')}</span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(secretKey);
                haptics.success();
                setCopied('secret');
                setTimeout(() => setCopied(null), 3000);
              }}
              style={{ ...styles.copyBtn, ...(copied === 'secret' ? styles.copyBtnCopied : {}) }}
            >
              <span style={{ ...styles.copyBtnText, ...(copied === 'secret' ? styles.copyBtnTextCopied : {}) }}>
                {copied === 'secret' ? t('wallet.view.copied') : t('wallet.view.copyBtn')}
              </span>
            </button>
          </div>
          <span style={styles.secretText}>{secretKey}</span>
          <span style={styles.secretWarning}>{t('wallet.view.secretWarning')}</span>
        </div>
      )}

      <PinModal
        visible={showPin}
        title={t('wallet.view.enterPin', 'Enter PIN')}
        error={pinError}
        onSubmit={handlePinSuccess}
        onCancel={() => { setShowPin(false); setPinError(false); }}
      />
    </PageShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  qrContainer: {
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: `1px solid ${COLORS.grid.border}`,
  },
  addressRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.xs,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  addressText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  copyBadge: {
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.sm,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 4,
    border: `1px solid ${COLORS.grid.border}`,
    display: 'inline-block',
  },
  copyBadgeCopied: {
    borderColor: COLORS.status.online,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  copyBadgeText: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  copyBadgeTextCopied: {
    color: COLORS.status.online,
  },
  balanceRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: 2,
  },
  balanceLabel: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.text.secondary,
    letterSpacing: 2,
  },
  balanceValue: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.text.accent,
    letterSpacing: 1,
  },
  battleValue: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.status.pvp,
    letterSpacing: 1,
  },
  battleBadge: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    color: COLORS.status.pvp,
    letterSpacing: 2,
    border: `1px solid ${COLORS.status.pvp}`,
    borderRadius: 4,
    paddingLeft: SPACING.xs,
    paddingRight: SPACING.xs,
    paddingTop: 1,
    paddingBottom: 1,
    opacity: 0.7,
  },
  balanceNetwork: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    color: COLORS.status.pvp,
    letterSpacing: 2,
    border: `1px solid ${COLORS.status.pvp}`,
    borderRadius: 4,
    paddingLeft: SPACING.xs,
    paddingRight: SPACING.xs,
    paddingTop: 1,
    paddingBottom: 1,
    opacity: 0.7,
  },
  secretBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface.elevated,
    borderRadius: 4,
    border: `1px solid ${COLORS.accent.fire}`,
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  secretHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyBtn: {
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.sm,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 4,
    border: `1px solid ${COLORS.accent.fire}`,
    background: 'none',
    cursor: 'pointer',
  },
  copyBtnCopied: {
    borderColor: COLORS.status.online,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  copyBtnText: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    color: COLORS.accent.fire,
    letterSpacing: 1,
  },
  copyBtnTextCopied: {
    color: COLORS.status.online,
  },
  secretText: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.accent.fire,
    letterSpacing: 0.5,
    wordBreak: 'break-all',
  },
  secretWarning: {
    fontFamily: FONTS.bodyLight,
    fontSize: 10,
    color: COLORS.text.danger,
    opacity: 0.8,
  },
};
