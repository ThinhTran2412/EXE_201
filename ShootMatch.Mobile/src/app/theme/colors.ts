// PicKic Design System → React Native tokens
export const colors = {
  // Core palette (từ EXE_UI pickic-design-system.css)
  background:   '#fff7e1',   // cream
  surface:      '#fff7e1',
  dark:         '#1a1a0f',
  accent:       '#cf4028',   // red clay (headings, CTAs)
  accentOrange: '#ff4200',   // clay accent button
  clay:         '#d9d4b8',   // shadow
  clayLight:    '#e8e4cc',
  white:        '#ffffff',

  // Text
  text:         '#1a1a0f',
  textMuted:    '#6b6b50',
  textLight:    '#9b9b7a',
  textInverse:  '#fff7e1',

  // Semantic
  primary:      '#1a1a0f',
  success:      '#2d6a4f',
  warning:      '#e9c46a',
  danger:       '#cf4028',
  info:         '#457b9d',

  // UI chrome
  border:       'rgba(26,26,15,0.10)',
  borderStrong: 'rgba(26,26,15,0.25)',
  overlay:      'rgba(26,26,15,0.50)',

  // Glass
  glass:        'rgba(255,247,225,0.75)',
  glassStrong:  'rgba(255,247,225,0.92)',

  // Tabs
  tabActive:    '#cf4028',
  tabInactive:  '#9b9b7a',
  tabBar:       '#fff7e1',
} as const;

export type ColorKey = keyof typeof colors;
