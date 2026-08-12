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
}

export const darkPalette: ColorPalette = {
  background: '#0F0F14',
  surface: '#16161F',
  surfaceElevated: '#1A1A22',
  surfaceLight: '#242432',
  surfaceHover: '#242430',
  border: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#6B6B80',
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  accent: '#3B82F6',
  onlineGreen: '#10B981',
  readReceiptBlue: '#38BDF8',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  receivedBubble: '#1E1E2A',
  receivedText: '#ECECF4',
  inputBackground: '#181824',
  glassBackground: 'rgba(26, 26, 34, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
};

export const lightPalette: ColorPalette = {
  background: '#F6F7FC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F3FB',
  surfaceLight: '#E8ECF8',
  surfaceHover: '#E5E8F5',
  border: 'rgba(0, 0, 0, 0.06)',
  textPrimary: '#0F0F17',
  textSecondary: '#5A5E73',
  textMuted: '#8E93A6',
  primary: '#6D28D9',
  primaryLight: '#7C3AED',
  accent: '#2563EB',
  onlineGreen: '#10B981',
  readReceiptBlue: '#0284C7',
  error: '#DC2626',
  warning: '#D97706',
  success: '#059669',
  cardShadow: 'rgba(0, 0, 0, 0.06)',
  receivedBubble: '#EDF0F7',
  receivedText: '#151520',
  inputBackground: '#F0F2FA',
  glassBackground: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
};

export const BUBBLE_THEMES: { id: string; name: string; gradient: [string, string]; receivedColorDark: string; receivedColorLight: string }[] = [
  { id: 'violet', name: 'Electric Violet', gradient: ['#7C3AED', '#3B82F6'], receivedColorDark: '#1E1E2A', receivedColorLight: '#EDF0F7' },
  { id: 'emerald', name: 'Teal Emerald', gradient: ['#0D9488', '#10B981'], receivedColorDark: '#172727', receivedColorLight: '#E6F4F1' },
  { id: 'sunset', name: 'Coral Sunset', gradient: ['#F43F5E', '#FB923C'], receivedColorDark: '#2B1A20', receivedColorLight: '#FDEEEF' },
  { id: 'neon', name: 'Neon Purple', gradient: ['#EC4899', '#8B5CF6'], receivedColorDark: '#29182C', receivedColorLight: '#F9EBFD' },
  { id: 'midnight', name: 'Midnight Deep', gradient: ['#1E3A8A', '#06B6D4'], receivedColorDark: '#131F33', receivedColorLight: '#EAF3FA' },
  { id: 'amber', name: 'Amber Gold', gradient: ['#D97706', '#F59E0B'], receivedColorDark: '#272016', receivedColorLight: '#FEF6E8' },
];
