export interface ColorPalette {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceLight: string;
  surfaceHover: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  accent: string;
  onlineGreen: string;
  readReceiptBlue: string;
  error: string;
  warning: string;
  success: string;
  cardShadow: string;
  receivedBubble: string;
  receivedText: string;
  inputBackground: string;
  glassBackground: string;
  glassBorder: string;
  clayHighlight: string;
  clayShadow: string;
  clayInsetDark: string;
  clayInsetLight: string;
}

export const darkPalette: ColorPalette = {
  background: '#12121A',
  surface: '#1B1B26',
  surfaceElevated: '#242436',
  surfaceLight: '#2D2D42',
  surfaceHover: '#222232',
  border: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F4F4F8',
  textSecondary: '#A5A5BA',
  textMuted: '#6E6E85',
  primary: '#8B7FD1',        // Dusty Lavender
  primaryLight: '#A197E0',
  accent: '#7B93D6',         // Soft Periwinkle
  onlineGreen: '#6FAFA0',    // Muted Mint
  readReceiptBlue: '#7B93D6',
  error: '#E57373',          // Soft Coral Red
  warning: '#E6A868',        // Soft Warm Peach
  success: '#6FAFA0',
  cardShadow: 'rgba(0, 0, 0, 0.45)',
  receivedBubble: '#222232',
  receivedText: '#ECECF4',
  inputBackground: '#161622',
  glassBackground: 'rgba(27, 27, 38, 0.92)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  clayHighlight: 'rgba(255, 255, 255, 0.16)',
  clayShadow: 'rgba(0, 0, 0, 0.40)',
  clayInsetDark: 'rgba(0, 0, 0, 0.35)',
  clayInsetLight: 'rgba(255, 255, 255, 0.08)',
};

export const lightPalette: ColorPalette = {
  background: '#ECECF4',
  surface: '#FFFFFF',
  surfaceElevated: '#F2F2FA',
  surfaceLight: '#E5E5F2',
  surfaceHover: '#DFDFEE',
  border: 'rgba(0, 0, 0, 0.06)',
  textPrimary: '#1E1E2C',
  textSecondary: '#66667E',
  textMuted: '#9494AA',
  primary: '#7467C0',
  primaryLight: '#8B7FD1',
  accent: '#5E7BBF',
  onlineGreen: '#529688',
  readReceiptBlue: '#5E7BBF',
  error: '#D9534F',
  warning: '#D48842',
  success: '#529688',
  cardShadow: 'rgba(80, 80, 120, 0.18)',
  receivedBubble: '#F5F5FC',
  receivedText: '#1E1E2C',
  inputBackground: '#E4E4F0',
  glassBackground: 'rgba(255, 255, 255, 0.95)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  clayHighlight: 'rgba(255, 255, 255, 0.85)',
  clayShadow: 'rgba(100, 100, 140, 0.22)',
  clayInsetDark: 'rgba(0, 0, 0, 0.10)',
  clayInsetLight: 'rgba(255, 255, 255, 0.90)',
};

export const BUBBLE_THEMES: { id: string; name: string; gradient: [string, string]; receivedColorDark: string; receivedColorLight: string }[] = [
  { id: 'lavender', name: 'Dusty Lavender', gradient: ['#8B7FD1', '#7B93D6'], receivedColorDark: '#222234', receivedColorLight: '#F5F5FC' },
  { id: 'mint', name: 'Muted Mint', gradient: ['#6FAFA0', '#7B93D6'], receivedColorDark: '#1C2726', receivedColorLight: '#EEF6F4' },
  { id: 'coral', name: 'Soft Coral', gradient: ['#E58A8A', '#E6A868'], receivedColorDark: '#2A1F22', receivedColorLight: '#FAF0F0' },
  { id: 'periwinkle', name: 'Soft Periwinkle', gradient: ['#7B93D6', '#8B7FD1'], receivedColorDark: '#202236', receivedColorLight: '#F0F2FA' },
  { id: 'sand', name: 'Warm Clay Sand', gradient: ['#D4A373', '#E6A868'], receivedColorDark: '#29221C', receivedColorLight: '#FAF5EE' },
  { id: 'sage', name: 'Muted Sage', gradient: ['#7EA68B', '#6FAFA0'], receivedColorDark: '#1E2620', receivedColorLight: '#EFF5F1' },
];
