import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  setTheme: (theme) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    set({ theme });
    SecureStore.setItemAsync('app_theme', theme).catch(console.error);
  },
  loadTheme: async () => {
    try {
      const storedTheme = await SecureStore.getItemAsync('app_theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        set({ theme: storedTheme });
      }
    } catch (e) {
      console.error('Error al cargar el tema desde SecureStore:', e);
    }
  },
}));
