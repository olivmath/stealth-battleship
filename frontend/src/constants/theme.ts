export const COLORS = {
  background: {
    dark: '#0a0e1a',
    medium: '#0c2d48',
    light: '#132f4c',
  },
  accent: {
    gold: '#f59e0b',
    goldDark: '#d97706',
    fire: '#f87171',
    fireDark: '#b91c1c',
  },
  grid: {
    border: '#1e3a5f',
    cellBg: 'rgba(10, 14, 26, 0.6)',
    ship: '#4a5568',
    shipLight: '#718096',
  },
  cell: {
    empty: 'rgba(30, 58, 95, 0.3)',
    ship: '#4a5568',
    hit: '#ef4444',
    miss: '#2d3748',
    sunk: '#7f1d1d',
  },
  text: {
    primary: '#e2e8f0',
    secondary: '#94a3b8',
    accent: '#f59e0b',
    danger: '#ef4444',
  },
  ui: {
    buttonBg: 'rgba(30, 58, 95, 0.8)',
    buttonBorder: '#f59e0b',
    disabledBg: 'rgba(30, 58, 95, 0.3)',
    disabledBorder: '#4a5568',
  },
} as const;

export const FONTS = {
  heading: 'Orbitron_700Bold',
  headingLight: 'Orbitron_400Regular',
  body: 'Rajdhani_600SemiBold',
  bodyLight: 'Rajdhani_400Regular',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const GRADIENT = {
  background: ['#0a0e1a', '#0c2d48', '#0a0e1a'] as const,
  card: ['rgba(30, 58, 95, 0.4)', 'rgba(12, 45, 72, 0.6)'] as const,
} as const;
