import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type Theme = 'light' | 'dark';

export interface ThemeTransition {
  active: boolean;
  oldTheme: Theme;
  nextTheme: Theme;
}

interface ThemeState {
  theme: Theme;
  transition: ThemeTransition | null;
  triggerTransition: (nextTheme: Theme) => void;
  clearTransition: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  transition: null,
  
  triggerTransition: (nextTheme) => {
    const oldTheme = get().theme;
    if (oldTheme === nextTheme) return;
    
    // Inicia la animación y cambia el tema de inmediato para Tailwind crossfade
    set({ 
      theme: nextTheme,
      transition: { active: true, oldTheme, nextTheme } 
    });
    SecureStore.setItemAsync('app_theme', nextTheme).catch(console.error);
  },

  clearTransition: () => {
    set({ transition: null });
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
