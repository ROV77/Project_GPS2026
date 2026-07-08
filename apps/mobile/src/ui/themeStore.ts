import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type Theme = 'light' | 'dark';

export interface ThemeTransition {
  active: boolean;
  x: number;
  y: number;
  nextTheme: Theme;
}

interface ThemeState {
  theme: Theme;
  transition: ThemeTransition | null;
  // triggerTransition inicia la animación circular
  triggerTransition: (x: number, y: number, nextTheme: Theme) => void;
  // commitTheme es llamado por el _layout cuando el círculo cubre la pantalla
  commitTheme: () => void;
  // fallback original o sin transición
  setTheme: (theme: Theme) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  transition: null,
  
  triggerTransition: (x, y, nextTheme) => {
    set({ transition: { active: true, x, y, nextTheme } });
  },

  commitTheme: () => {
    const state = get();
    if (state.transition?.active) {
      const next = state.transition.nextTheme;
      set({ theme: next, transition: null });
      SecureStore.setItemAsync('app_theme', next).catch(console.error);
    }
  },

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
