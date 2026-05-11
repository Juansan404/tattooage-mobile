import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'tattooage_theme';

interface ThemeState {
  isDark: boolean;
  toggle: () => Promise<void>;
  restore: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: true,

  toggle: async () => {
    const next = !get().isDark;
    set({ isDark: next });
    await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  },

  restore: async () => {
    const stored = await AsyncStorage.getItem(THEME_KEY);
    if (stored) {
      set({ isDark: stored === 'dark' });
    }
  },
}));
