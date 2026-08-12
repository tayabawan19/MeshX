import { darkPalette, lightPalette, BUBBLE_THEMES } from './colors';
import { typography } from './typography';

export const radius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  }),
};

export { darkPalette, lightPalette, BUBBLE_THEMES, typography };
