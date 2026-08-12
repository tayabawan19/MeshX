import { create } from 'zustand';
import { ColorPalette, darkPalette, lightPalette, BUBBLE_THEMES } from '../theme/colors';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  themeMode: ThemeMode;
  palette: ColorPalette;
  theme: { colors: ColorPalette };
  chatThemes: Record<string, { gradient: [string, string]; receivedColor: string }>;
  wallpaper: Record<string, string>;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setChatBubbleTheme: (chatId: string, gradient: [string, string], receivedColor: string) => void;
  setChatWallpaper: (chatId: string, wallpaperUrl: string) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'dark',
  palette: darkPalette,
  theme: { colors: darkPalette },
  chatThemes: {},
  wallpaper: {},

  setThemeMode: (mode: ThemeMode) => {
    const selected = mode === 'dark' ? darkPalette : lightPalette;
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

  setChatBubbleTheme: (chatId: string, gradient: [string, string], receivedColor: string) => {
    set((state) => ({
      chatThemes: {
        ...state.chatThemes,
        [chatId]: { gradient, receivedColor },
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
