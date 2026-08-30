export interface ColorPalette {
  background: string;          // Discord Base background: #1E1F22
  surface: string;             // Elevated surface tier 1: #2B2D31
  surfaceElevated: string;     // Elevated surface tier 2 (headers/modals): #313338
  surfaceLight: string;        // Slightly lighter charcoal / active state: #35373C
  surfaceHover: string;        // Hover surface: #3F4147
  border: string;              // Subtle divider/border
  borderBold: string;          // Confident border if needed
  textPrimary: string;         // Off-white primary text: #F2F3F5
  textSecondary: string;       // Muted gray secondary text: #949BA4
  textMuted: string;           // Darker muted text: #80848E
  primary: string;             // Blurple identity color: #5865F2
  primaryLight: string;        // Light Blurple: #7983F5
  secondary: string;           // Blurple alias for consistency: #5865F2
  accent: string;              // Blurple identity accent: #5865F2
  highlight: string;           // Blurple highlight: #5865F2
  cyan: string;                // Cyan accent alias: #5865F2
  purple: string;              // Blurple: #5865F2
  onlineGreen: string;         // Online / Success status: #23A55A
  readReceiptBlue: string;     // Read receipt: #5865F2
  error: string;               // Error / Destructive status: #F23F42
  warning: string;             // Idle / Warning status: #F0B232
  success: string;             // Success status: #23A55A
  cardShadow: string;          // Subtle shadow color
  receivedBubble: string;      // Received message bubble background: #2B2D31
  receivedText: string;        // Received text: #F2F3F5
  receivedBorder: string;      // Received bubble border
  inputBackground: string;     // Input field background: #2B2D31 (or #1E1F22)
  glassBackground: string;     // Modal / sheet glass background: #313338
  glassBorder: string;         // Modal subtle border
  hardShadow: string;          // Fallback shadow
  clayHighlight: string;       // Neutral subtle highlight
  clayShadow: string;          // Neutral subtle shadow
  clayInsetDark: string;       // Subtle inset
  clayInsetLight: string;      // Subtle inset
}

// Contacts avatar fallback colors in Discord muted tone
export const CONTACT_ACCENTS = [
  '#5865F2', // Blurple
  '#4752C4', // Dark Blurple
  '#5C64F4', // Medium Blurple
  '#4E5058', // Charcoal Neutral
  '#6D6F78', // Slate Gray
  '#35373C', // Deep Charcoal
];

export const getContactAccent = (_seed: string = ''): string => {
  // Return consistent Blurple/Charcoal identity
  return '#5865F2';
};

export const darkPalette: ColorPalette = {
  background: '#1E1F22',
  surface: '#2B2D31',
  surfaceElevated: '#313338',
  surfaceLight: '#35373C',
  surfaceHover: '#3F4147',
  border: 'rgba(255, 255, 255, 0.08)',
  borderBold: 'rgba(255, 255, 255, 0.16)',
  textPrimary: '#F2F3F5',
  textSecondary: '#949BA4',
  textMuted: '#80848E',
  primary: '#5865F2',        // Blurple identity
  primaryLight: '#7983F5',
  secondary: '#5865F2',
  accent: '#5865F2',
  highlight: '#5865F2',
  cyan: '#5865F2',
  purple: '#5865F2',
  onlineGreen: '#23A55A',    // Discord online status green
  readReceiptBlue: '#5865F2',
  error: '#F23F42',          // Discord error/destructive red
  warning: '#F0B232',        // Discord warning/idle yellow
  success: '#23A55A',
  cardShadow: 'rgba(0, 0, 0, 0.25)',
  receivedBubble: '#2B2D31',
  receivedText: '#F2F3F5',
  receivedBorder: 'rgba(255, 255, 255, 0.04)',
  inputBackground: '#2B2D31',
  glassBackground: '#313338',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  hardShadow: 'rgba(0, 0, 0, 0.25)',
  clayHighlight: 'transparent',
  clayShadow: 'transparent',
  clayInsetDark: 'transparent',
  clayInsetLight: 'transparent',
};

export const lightPalette: ColorPalette = {
  background: '#1E1F22',
  surface: '#2B2D31',
  surfaceElevated: '#313338',
  surfaceLight: '#35373C',
  surfaceHover: '#3F4147',
  border: 'rgba(255, 255, 255, 0.08)',
  borderBold: 'rgba(255, 255, 255, 0.16)',
  textPrimary: '#F2F3F5',
  textSecondary: '#949BA4',
  textMuted: '#80848E',
  primary: '#5865F2',
  primaryLight: '#7983F5',
  secondary: '#5865F2',
  accent: '#5865F2',
  highlight: '#5865F2',
  cyan: '#5865F2',
  purple: '#5865F2',
  onlineGreen: '#23A55A',
  readReceiptBlue: '#5865F2',
  error: '#F23F42',
  warning: '#F0B232',
  success: '#23A55A',
  cardShadow: 'rgba(0, 0, 0, 0.25)',
  receivedBubble: '#2B2D31',
  receivedText: '#F2F3F5',
  receivedBorder: 'rgba(255, 255, 255, 0.04)',
  inputBackground: '#2B2D31',
  glassBackground: '#313338',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  hardShadow: 'rgba(0, 0, 0, 0.25)',
  clayHighlight: 'transparent',
  clayShadow: 'transparent',
  clayInsetDark: 'transparent',
  clayInsetLight: 'transparent',
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
  { id: 'blurple', name: 'Blurple', color: '#5865F2', textColor: '#FFFFFF', receivedColorDark: '#2B2D31', receivedColorLight: '#2B2D31', gradient: ['#5865F2', '#4752C4'] },
];
