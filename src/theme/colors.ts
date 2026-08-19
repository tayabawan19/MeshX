export interface ColorPalette {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceLight: string;
  surfaceHover: string;
  border: string;
  borderBold: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;           // Hot Coral
  primaryLight: string;
  secondary: string;         // Electric Lime
  accent: string;            // Deep Cobalt
  highlight: string;         // Sunshine Yellow
  cyan: string;              // Cyber Cyan
  purple: string;            // Bubblegum Violet
  onlineGreen: string;       // Electric Lime for high contrast online dot
  readReceiptBlue: string;   // Cyber Cyan / Electric Blue
  error: string;             // Hot Coral
  warning: string;           // Sunshine Yellow
  success: string;           // Electric Lime
  cardShadow: string;
  receivedBubble: string;
  receivedText: string;
  receivedBorder: string;
  inputBackground: string;
  glassBackground: string;
  glassBorder: string;
  hardShadow: string;
  clayHighlight: string;
  clayShadow: string;
  clayInsetDark: string;
  clayInsetLight: string;
}

export const CONTACT_ACCENTS = [
  '#FF4D5E', // Hot Coral
  '#C6FF3D', // Electric Lime
  '#2E4BFF', // Deep Cobalt
  '#FFD23F', // Sunshine Yellow
  '#00F0FF', // Cyber Cyan
  '#A855F7', // Bubblegum Purple
];

export const getContactAccent = (seed: string = ''): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CONTACT_ACCENTS.length;
  return CONTACT_ACCENTS[index];
};

export const darkPalette: ColorPalette = {
  background: '#100F17',
  surface: '#181726',
  surfaceElevated: '#211F36',
  surfaceLight: '#2A2744',
  surfaceHover: '#2E2B4B',
  border: 'rgba(255, 255, 255, 0.12)',
  borderBold: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#B4B2C8',
  textMuted: '#7D7A96',
  primary: '#FF4D5E',        // Hot Coral
  primaryLight: '#FF707E',
  secondary: '#C6FF3D',      // Electric Lime
  accent: '#2E4BFF',         // Deep Cobalt
  highlight: '#FFD23F',      // Sunshine Yellow
  cyan: '#00F0FF',           // Cyber Cyan
  purple: '#A855F7',         // Bubblegum Violet
  onlineGreen: '#C6FF3D',    // Vibrant Electric Lime
  readReceiptBlue: '#00F0FF',
  error: '#FF4D5E',
  warning: '#FFD23F',
  success: '#C6FF3D',
  cardShadow: '#000000',
  receivedBubble: '#1C1A2E',
  receivedText: '#FFFFFF',
  receivedBorder: '#2E2B48',
  inputBackground: '#181726',
  glassBackground: 'rgba(24, 23, 38, 0.94)',
  glassBorder: 'rgba(255, 255, 255, 0.14)',
  hardShadow: '#000000',
  clayHighlight: 'rgba(255, 255, 255, 0.20)',
  clayShadow: '#000000',
  clayInsetDark: 'rgba(0, 0, 0, 0.40)',
  clayInsetLight: 'rgba(255, 255, 255, 0.10)',
};

export const lightPalette: ColorPalette = {
  background: '#F0EFE9',
  surface: '#FFFFFF',
  surfaceElevated: '#F9F8F5',
  surfaceLight: '#E8E7E0',
  surfaceHover: '#E0DFD8',
  border: '#000000',
  borderBold: '#000000',
  textPrimary: '#100F17',
  textSecondary: '#4A485A',
  textMuted: '#7D7A96',
  primary: '#FF4D5E',
  primaryLight: '#FF707E',
  secondary: '#A3E600',
  accent: '#2E4BFF',
  highlight: '#FFC800',
  cyan: '#00C8D6',
  purple: '#9333EA',
  onlineGreen: '#A3E600',
  readReceiptBlue: '#2E4BFF',
  error: '#FF4D5E',
  warning: '#FFC800',
  success: '#A3E600',
  cardShadow: '#000000',
  receivedBubble: '#FFFFFF',
  receivedText: '#100F17',
  receivedBorder: '#000000',
  inputBackground: '#FFFFFF',
  glassBackground: 'rgba(255, 255, 255, 0.95)',
  glassBorder: '#000000',
  hardShadow: '#000000',
  clayHighlight: 'rgba(255, 255, 255, 0.85)',
  clayShadow: '#000000',
  clayInsetDark: 'rgba(0, 0, 0, 0.15)',
  clayInsetLight: 'rgba(255, 255, 255, 0.90)',
};

export const BUBBLE_THEMES: {
  id: string;
  name: string;
  color: string;
  textColor: string;
  receivedColorDark: string;
  receivedColorLight: string;
  gradient: [string, string];
}[] = [
  { id: 'coral', name: 'Hot Coral', color: '#FF4D5E', textColor: '#FFFFFF', receivedColorDark: '#1C1A2E', receivedColorLight: '#FFFFFF', gradient: ['#FF4D5E', '#FF3347'] },
  { id: 'cobalt', name: 'Deep Cobalt', color: '#2E4BFF', textColor: '#FFFFFF', receivedColorDark: '#1C1A2E', receivedColorLight: '#FFFFFF', gradient: ['#2E4BFF', '#1A35E0'] },
  { id: 'lime', name: 'Electric Lime', color: '#C6FF3D', textColor: '#100F17', receivedColorDark: '#1C1A2E', receivedColorLight: '#FFFFFF', gradient: ['#C6FF3D', '#B0F516'] },
  { id: 'yellow', name: 'Sunshine Yellow', color: '#FFD23F', textColor: '#100F17', receivedColorDark: '#1C1A2E', receivedColorLight: '#FFFFFF', gradient: ['#FFD23F', '#FFC714'] },
  { id: 'cyan', name: 'Cyber Cyan', color: '#00F0FF', textColor: '#100F17', receivedColorDark: '#1C1A2E', receivedColorLight: '#FFFFFF', gradient: ['#00F0FF', '#00D6E6'] },
  { id: 'purple', name: 'Bubblegum Violet', color: '#A855F7', textColor: '#FFFFFF', receivedColorDark: '#1C1A2E', receivedColorLight: '#FFFFFF', gradient: ['#A855F7', '#9333EA'] },
];
