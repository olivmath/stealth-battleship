export const COLORS = {
  background: { dark: '#0a0e1a', medium: '#0c2d48', light: '#132f4c' },
  accent: { gold: '#f59e0b', goldDark: '#d97706', fire: '#f87171', fireDark: '#b91c1c', victory: '#22c55e' },
  grid: { border: '#1e3a5f', cellBg: 'rgba(10, 14, 26, 0.6)', ship: '#4a5568', shipLight: '#718096' },
  cell: { empty: 'rgba(30, 58, 95, 0.3)', ship: '#4a5568', hit: '#f87171', miss: '#1e3a5f', sunk: '#b91c1c' },
  text: { primary: '#e2e8f0', secondary: '#94a3b8', accent: '#f59e0b', danger: '#f87171' },
  ui: { buttonBg: 'rgba(30, 58, 95, 0.8)', buttonBorder: '#f59e0b', disabledBg: 'rgba(30, 58, 95, 0.3)', disabledBorder: '#4a5568' },
  surface: { card: 'rgba(30, 58, 95, 0.2)', cardBorder: 'rgba(30, 58, 95, 0.3)', elevated: 'rgba(30, 58, 95, 0.4)', subtle: 'rgba(30, 58, 95, 0.15)' },
  overlay: {
    goldGlow: 'rgba(245, 158, 11, 0.05)', goldSoft: 'rgba(245, 158, 11, 0.08)', goldMedium: 'rgba(245, 158, 11, 0.1)',
    goldStrong: 'rgba(245, 158, 11, 0.2)', goldPreview: 'rgba(245, 158, 11, 0.3)',
    fireGlow: 'rgba(239, 68, 68, 0.1)', fireHit: 'rgba(239, 68, 68, 0.3)',
    victoryGlow: 'rgba(34, 197, 94, 0.3)', backdrop: 'rgba(0, 0, 0, 0.7)', backdropLight: 'rgba(0, 0, 0, 0.6)',
    darkPanel: 'rgba(10, 25, 47, 0.8)', secondaryFade: 'rgba(148, 163, 184, 0.3)',
  },
  status: { online: '#22c55e', pvp: '#22d3ee', waiting: '#eab308', offline: '#6b7280' },
  marker: { miss: '#38bdf8', hitDot: '#e2e8f0', white: '#ffffff', sunkShip: '#3d4758', miniHit: '#ff6b6b', miniMiss: '#64748b', miniSunk: '#991b1b' },
} as const;

export const FONTS = {
  heading: "'Orbitron', sans-serif",
  headingLight: "'Orbitron', sans-serif",
  body: "'Rajdhani', sans-serif",
  bodyLight: "'Rajdhani', sans-serif",
} as const;

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const RADIUS = { sharp: 2, default: 4, md: 8, lg: 12, pill: 999 } as const;

export const SHADOWS = {
  sm: { boxShadow: '0px 1px 2px rgba(0,0,0,0.2)' },
  md: { boxShadow: '0px 2px 4px rgba(0,0,0,0.3)' },
  lg: { boxShadow: '0px 4px 8px rgba(0,0,0,0.4)' },
  glow: { boxShadow: '0px 0px 12px rgba(245,158,11,0.4)' },
};

export const LAYOUT = { maxContentWidth: 420, maxContentWidthTablet: 600, maxContentWidthDesktop: 800, screenPadding: 16 } as const;

export const FONT_SIZES = { caption: 9, label: 10, sm: 11, body: 13, md: 14, lg: 18, h3: 20, h2: 28, h1: 32, hero: 42, score: 48 } as const;

/** Standardized typography scale — use these instead of ad-hoc font combos */
export const TYPOGRAPHY = {
  hero:     { fontFamily: FONTS.heading, fontSize: 32, letterSpacing: 4, fontWeight: 700 },
  title:    { fontFamily: FONTS.heading, fontSize: 22, letterSpacing: 3, fontWeight: 700 },
  subtitle: { fontFamily: FONTS.body,    fontSize: 16, letterSpacing: 1, fontWeight: 600 },
  body:     { fontFamily: FONTS.body,    fontSize: 15, letterSpacing: 0, fontWeight: 600 },
  caption:  { fontFamily: FONTS.body,    fontSize: 13, letterSpacing: 0.5, fontWeight: 400 },
  label:    { fontFamily: FONTS.heading, fontSize: 11, letterSpacing: 2, fontWeight: 400 },
} as const;

/** Button variant tokens — primary/secondary/danger/ghost */
export const BUTTON_VARIANTS = {
  primary:   { bg: COLORS.accent.gold, text: COLORS.background.dark, border: COLORS.accent.gold },
  secondary: { bg: 'transparent', text: COLORS.text.secondary, border: COLORS.grid.border },
  danger:    { bg: 'transparent', text: COLORS.accent.fire, border: COLORS.accent.fire },
  ghost:     { bg: 'transparent', text: COLORS.text.secondary, border: 'transparent' },
  success:   { bg: 'transparent', text: COLORS.status.online, border: COLORS.status.online },
  pvp:       { bg: 'transparent', text: COLORS.status.pvp, border: COLORS.status.pvp },
} as const;

export const GRADIENT = {
  background: ['#0a0e1a', '#0c2d48', '#0a0e1a'] as const,
  card: ['rgba(30, 58, 95, 0.4)', 'rgba(12, 45, 72, 0.6)'] as const,
} as const;
