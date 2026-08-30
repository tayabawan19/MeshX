// Velvet Crimson & Dark Plum Gradient Design System (Matching Mockup)

export interface ColorPalette {
  // Backgrounds & Surfaces
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfaceLight: string;
  inputBackground: string;

  // Velvet Crimson Gradient & Identity
  primary: string;
  primaryLight: string;
  primaryDark: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  accent: string;

  // Secondary Accents & Neutrals
  secondary: string;
  secondaryLight: string;
  highlight: string;

  // Status Colors
  onlineGreen: string;
  error: string;
  warning: string;
  readReceiptBlue: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textContrast: string;

  // Borders & Dividers
  border: string;
  borderLight: string;
  divider: string;

  // Chat Bubbles
  sentBubble: string;
  sentBubbleGradient: [string, string];
  receivedBubble: string;
  receivedBubbleText: string;

  // Compatibility Tokens
  clayHighlight: string;
  clayShadow: string;
}

export const darkPalette: ColorPalette = {
  // Crisp White Sheet on Crimson Gradient Base
  background: '#F8F9FB',
  backgroundSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F4F5F7',
  surfaceLight: '#EAECEF',
  inputBackground: '#F4F5F7',

  // Velvet Crimson Gradient
  primary: '#8E0E2C',
  primaryLight: '#B81B38',
  primaryDark: '#540F27',
  gradientStart: '#8E0E2C',
  gradientMid: '#540F27',
  gradientEnd: '#160D1E',
  accent: '#C2185B',

  // Secondary Accents
  secondary: '#8E0E2C',
  secondaryLight: '#B81B38',
  highlight: '#D81B60',

  // Functional Statuses
  onlineGreen: '#2E7D32',
  error: '#C62828',
  warning: '#F57F17',
  readReceiptBlue: '#1565C0',

  // Text Hierarchy
  textPrimary: '#1A1A1A',
  textSecondary: '#616161',
  textMuted: '#9E9E9E',
  textContrast: '#FFFFFF',

  // Borders
  border: '#E0E0E0',
  borderLight: '#EEEEEE',
  divider: '#EEEEEE',

  // Message Bubbles
  sentBubble: '#8E0E2C',
  sentBubbleGradient: ['#8E0E2C', '#540F27'],
  receivedBubble: '#FFFFFF',
  receivedBubbleText: '#1A1A1A',

  // Compatibility
  clayHighlight: 'rgba(255, 255, 255, 0.4)',
  clayShadow: 'rgba(0, 0, 0, 0.12)',
};

export const lightPalette: ColorPalette = {
  ...darkPalette,
};

export const BUBBLE_THEMES = [
  { name: 'Crimson Velvet', color: '#8E0E2C', receivedColorDark: '#FFFFFF' },
  { name: 'Rose Wine', color: '#B81B38', receivedColorDark: '#FFFFFF' },
  { name: 'Plum Dusk', color: '#540F27', receivedColorDark: '#FFFFFF' },
  { name: 'Midnight Berry', color: '#3A0E2E', receivedColorDark: '#FFFFFF' },
];

export const getContactAccent = (name: string): string => {
  const accents = ['#8E0E2C', '#B81B38', '#540F27', '#C2185B', '#7B1FA2', '#AD1457'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return accents[Math.abs(hash) % accents.length];
};
