// 4px base grid
export const spacing = {
  0:   0,
  0.5: 2,
  1:   4,
  1.5: 6,
  2:   8,
  2.5: 10,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  16:  64,
  20:  80,
  24:  96,
} as const;

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  '2xl': 32,
  full: 9999,
} as const;

export const shadows = {
  clay: {
    shadowColor: '#d9d4b8',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  clayStrong: {
    shadowColor: '#b8b49c',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
  soft: {
    shadowColor: '#1a1a0f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#1a1a0f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
