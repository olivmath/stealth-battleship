import React, { ReactNode } from 'react';
import { GradientContainer } from './GradientContainer';
import { NavalText } from './NavalText';
import { Divider } from './Divider';
import { COLORS, SPACING, LAYOUT } from '../../shared/theme';

interface Props {
  /** Page title rendered as hero text */
  title?: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Accent color override (e.g. cyan for wallet pages) */
  accentColor?: string;
  /** Max width: 'default' (420px) | 'wide' (800px) | 'medium' (600px) */
  maxWidth?: 'default' | 'medium' | 'wide';
  /** Main scrollable content */
  children: ReactNode;
  /** Fixed bottom action bar content */
  actions?: ReactNode;
  /** Extra header content (e.g. player name below title) */
  headerExtra?: ReactNode;
  /** Hide header entirely (for pages like Splash/Tutorial with custom layouts) */
  hideHeader?: boolean;
  /** Container style overrides */
  style?: React.CSSProperties;
  /** Content area style overrides */
  contentStyle?: React.CSSProperties;
}

const maxWidthMap = {
  default: LAYOUT.maxContentWidth,
  medium: LAYOUT.maxContentWidthTablet,
  wide: LAYOUT.maxContentWidthDesktop,
} as const;

export function PageShell({
  title,
  subtitle,
  accentColor = COLORS.accent.gold,
  maxWidth = 'default',
  children,
  actions,
  headerExtra,
  hideHeader = false,
  style,
  contentStyle,
}: Props) {
  return (
    <GradientContainer style={style}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: '100%',
          maxWidth: maxWidthMap[maxWidth],
          boxSizing: 'border-box' as const,
          overflow: 'hidden',
        }}
      >
        {/* Scrollable area: header + content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            ...contentStyle,
          }}
        >
          {!hideHeader && title && (
            <header
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: SPACING.xl,
                marginBottom: SPACING.lg,
                flexShrink: 0,
              }}
            >
              <NavalText variant="h1" color={accentColor}>
                {title}
              </NavalText>
              {subtitle && (
                <NavalText
                  variant="bodyLight"
                  letterSpacing={6}
                  style={{ marginTop: SPACING.xs }}
                >
                  {subtitle}
                </NavalText>
              )}
              {headerExtra}
              <Divider width={60} color={accentColor} style={{ marginTop: SPACING.md }} />
            </header>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>

        {/* Fixed action bar */}
        {actions && (
          <div
            style={{
              padding: SPACING.lg,
              paddingTop: SPACING.md,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.sm,
              flexShrink: 0,
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </GradientContainer>
  );
}
