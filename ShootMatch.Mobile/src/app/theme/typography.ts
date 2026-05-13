import { Platform } from 'react-native';

export const fonts = {
  display:  Platform.select({ ios: 'Georgia', android: 'serif' }),
  sans:     Platform.select({ ios: 'System',  android: 'sans-serif' }),
  mono:     Platform.select({ ios: 'Courier', android: 'monospace' }),
} as const;

export const fontSizes = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 48,
} as const;

export const fontWeights = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
} as const;

export const lineHeights = {
  tight:   1.1,
  normal:  1.4,
  relaxed: 1.6,
} as const;

export const letterSpacings = {
  tight:  -0.5,
  normal:  0,
  wide:    0.5,
  wider:   1.2,
  widest:  2.0,
} as const;
