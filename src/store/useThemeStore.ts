import { create } from 'zustand';
import { ColorPalette, darkPalette, lightPalette, BUBBLE_THEMES } from '../theme/colors';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  palette: ColorPalette;
  theme: { colors: ColorPalette };
  chatThemes: Record<string, { color?: string; gradient?: [string, string]; receivedColor: string }>;
  wallpaper: Record<string, string>;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setChatBubbleTheme: (chatId: string, colorOrGradient: string | [string, string], receivedColor: string) => void;
  setChatWallpaper: (chatId: string, wallpaperUrl: string) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'dark',
  palette: darkPalette,
  theme: { colors: darkPalette },
  chatThemes: {},
  wallpaper: {},

  setThemeMode: (mode: ThemeMode) => {
    const selected = mode === 'light' ? lightPalette : darkPalette;
    set({
      themeMode: mode,
      palette: selected,
      theme: { colors: selected },
    });
  },

  toggleTheme: () => {
    const nextMode = get().themeMode === 'dark' ? 'light' : 'dark';
    const selected = nextMode === 'dark' ? darkPalette : lightPalette;
    set({
      themeMode: nextMode,
      palette: selected,
      theme: { colors: selected },
    });
  },

  setChatBubbleTheme: (chatId: string, colorOrGradient: string | [string, string], receivedColor: string) => {
    const isGradient = Array.isArray(colorOrGradient);
    set((state) => ({
      chatThemes: {
        ...state.chatThemes,
        [chatId]: {
          color: isGradient ? colorOrGradient[0] : colorOrGradient,
          gradient: isGradient ? colorOrGradient : [colorOrGradient, colorOrGradient],
          receivedColor,
        },
      },
    }));
  },

  setChatWallpaper: (chatId: string, wallpaperUrl: string) => {
    set((state) => ({
      wallpaper: {
        ...state.wallpaper,
        [chatId]: wallpaperUrl,
      },
    }));
  },
}));
