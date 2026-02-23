import React from 'react';
import { RadarSpinner } from './RadarSpinner';
import { NavalText } from './NavalText';
import { NavalButton } from './NavalButton';
import { COLORS, SPACING } from '../../shared/theme';

type Status = 'loading' | 'error' | 'empty';

interface Props {
  status: Status;
  /** Primary message */
  message?: string;
  /** Secondary detail text */
  detail?: string;
  /** CTA button label (for error retry / empty state action) */
  actionLabel?: string;
  /** CTA callback */
  onAction?: () => void;
  /** Spinner size for loading state */
  spinnerSize?: number;
}

const icons: Record<Status, string> = {
  loading: '',
  error: '\u26A0',   // warning triangle
  empty: '\u2693',   // anchor
};

export function StatusFeedback({
  status,
  message,
  detail,
  actionLabel,
  onAction,
  spinnerSize = 48,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
        padding: SPACING.xl,
        flex: 1,
      }}
      role="status"
      aria-live="polite"
    >
      {status === 'loading' ? (
        <RadarSpinner size={spinnerSize} />
      ) : (
        <span style={{ fontSize: 40, opacity: 0.5 }}>{icons[status]}</span>
      )}

      {message && (
        <NavalText
          variant="body"
          color={status === 'error' ? COLORS.accent.fire : COLORS.text.secondary}
          style={{ textAlign: 'center' }}
        >
          {message}
        </NavalText>
      )}

      {detail && (
        <NavalText variant="caption" color={COLORS.text.secondary} style={{ textAlign: 'center', opacity: 0.7 }}>
          {detail}
        </NavalText>
      )}

      {actionLabel && onAction && (
        <NavalButton
          title={actionLabel}
          onPress={onAction}
          variant={status === 'error' ? 'danger' : 'secondary'}
          size="small"
        />
      )}
    </div>
  );
}
