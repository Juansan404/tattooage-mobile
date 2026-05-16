import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../i18n/translations';

const LANG_KEY = 'tattooage_language';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  restore: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'es',

  setLanguage: async (lang) => {
    set({ language: lang });
    await AsyncStorage.setItem(LANG_KEY, lang);
  },

  restore: async () => {
    const stored = await AsyncStorage.getItem(LANG_KEY);
    if (stored) set({ language: stored as Language });
  },
}));
