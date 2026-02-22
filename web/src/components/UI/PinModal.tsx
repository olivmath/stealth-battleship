import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../shared/theme';
import styles from './PinModal.module.css';

interface Props {
  visible: boolean;
  pinLength?: number;
  title?: string;
  error?: boolean;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}

export function PinModal({ visible, pinLength = 4, title, error, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [shaking, setShaking] = useState(false);
  const submitted = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) {
      setPin('');
      setShaking(false);
      submitted.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  // Handle error: show red dots + shake, then clear
  useEffect(() => {
    if (error) {
      setShaking(true);
      const timer = setTimeout(() => {
        setShaking(false);
        setPin('');
        submitted.current = false;
        setTimeout(() => inputRef.current?.focus(), 50);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-submit when PIN reaches target length
  useEffect(() => {
    if (pin.length >= pinLength && !submitted.current) {
      submitted.current = true;
      onSubmit(pin);
    }
  }, [pin, pinLength, onSubmit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (shaking) return;
    const digits = e.target.value.replace(/\D/g, '');
    setPin(digits);
  };

  if (!visible) return null;

  const isError = shaking || error;
  const dotColor = isError ? COLORS.accent.fire : COLORS.status.pvp;

  // Visual dots
  const dots = Array.from({ length: pinLength }, (_, i) => (
    <div
      key={i}
      style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        border: `1.5px solid ${i < pin.length ? dotColor : isError ? COLORS.accent.fireDark : COLORS.grid.border}`,
        backgroundColor: i < pin.length ? dotColor : 'transparent',
        transition: 'background-color 0.15s, border-color 0.15s',
      }}
    />
  ));

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={t('wallet.pin.title')}
    >
      <div
        className={styles.modal}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.focus();
        }}
        style={{
          maxWidth: 320,
          width: '100%',
          backgroundColor: COLORS.background.dark,
          borderRadius: RADIUS.default,
          border: `1px solid ${COLORS.grid.border}`,
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.lg,
          alignItems: 'center',
          ...SHADOWS.md,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.heading,
            fontSize: 14,
            color: COLORS.status.pvp,
            letterSpacing: 2,
            textAlign: 'center',
          }}
        >
          {title ?? t('wallet.pin.title')}
        </span>

        <div
          className={`${styles.dotsRow} ${shaking ? styles.shake : ''}`}
          style={{ gap: SPACING.md }}
        >
          {dots}
        </div>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={pinLength}
          value={pin}
          onChange={handleChange}
          autoFocus
          style={{
            position: 'absolute',
            opacity: 0,
            width: 1,
            height: 1,
          }}
        />

        <button
          onClick={onCancel}
          style={{
            paddingTop: SPACING.sm,
            paddingBottom: SPACING.sm,
            paddingLeft: SPACING.lg,
            paddingRight: SPACING.lg,
            borderRadius: RADIUS.default,
            border: `1px solid ${COLORS.grid.border}`,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontFamily: FONTS.heading,
            fontSize: 11,
            color: COLORS.text.secondary,
            letterSpacing: 1,
          }}
        >
          {t('wallet.pin.cancel')}
        </button>
      </div>
    </div>,
    document.body
  );
}
