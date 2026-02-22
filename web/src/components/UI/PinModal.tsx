import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SPACING } from '../../shared/theme';
import { NavalButton } from './NavalButton';
import { NavalText } from './NavalText';
import styles from './PinModal.module.css';

interface PinModalProps {
  visible: boolean;
  title: string;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  minLength?: number;
  maxLength?: number;
  error?: string;
}

export function PinModal({ visible, title, onSubmit, onCancel, minLength = 4, maxLength = 6, error }: PinModalProps) {
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) { setPin(''); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [visible]);

  useEffect(() => {
    if (pin.length >= maxLength) onSubmit(pin);
  }, [pin, maxLength, onSubmit]);

  if (!visible) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ backgroundColor: COLORS.background.dark, borderColor: COLORS.surface.cardBorder }}>
        <NavalText variant="h3" align="center">{title}</NavalText>
        <div className={styles.dots}>
          {Array.from({ length: maxLength }).map((_, i) => (
            <div key={i} className={styles.dot} style={{
              backgroundColor: i < pin.length ? COLORS.accent.gold : 'transparent',
              borderColor: COLORS.accent.gold,
            }} />
          ))}
        </div>
        <input ref={inputRef} type="password" inputMode="numeric" pattern="[0-9]*" maxLength={maxLength}
          value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          className={styles.hiddenInput} autoFocus />
        {error && <NavalText variant="caption" color={COLORS.accent.fire} align="center">{error}</NavalText>}
        <NavalButton title="Cancel" onPress={onCancel} variant="ghost" size="sm" />
      </div>
    </div>,
    document.body
  );
}
