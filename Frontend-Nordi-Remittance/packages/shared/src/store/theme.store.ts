// ============================================================================
// THEME STORE - Zustand store for theme management
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getPersistStorage } from './persistStorage';

// ========================
// TYPES
// ========================
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDarkMode: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleDarkMode: () => void;
  initializeTheme: () => void;
}

// ========================
// PLATFORM HOOKS
// ========================
// Web applies the `dark` class to <html> and reads `matchMedia`; React Native
// has no DOM, so it swaps these for a native color-scheme listener/applier.
// Both default to safe no-ops/false so this module never crashes off-web.
let getSystemPreferenceImpl: () => boolean = () => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

let applyThemeImpl: (isDark: boolean) => void = (isDark) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

export function configureThemeStore(options: {
  getSystemPreference?: () => boolean;
  applyTheme?: (isDark: boolean) => void;
}): void {
  if (options.getSystemPreference) getSystemPreferenceImpl = options.getSystemPreference;
  if (options.applyTheme) applyThemeImpl = options.applyTheme;
}

const getSystemPreference = (): boolean => getSystemPreferenceImpl();
const applyTheme = (isDark: boolean): void => applyThemeImpl(isDark);

// ========================
// STORE
// ========================
const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      isDarkMode: false,

      setMode: (mode: ThemeMode) => {
        let isDark = false;
        
        if (mode === 'dark') {
          isDark = true;
        } else if (mode === 'light') {
          isDark = false;
        } else {
          // system mode
          isDark = getSystemPreference();
        }
        
        applyTheme(isDark);
        set({ mode, isDarkMode: isDark });
      },

      toggleDarkMode: () => {
        const { isDarkMode } = get();
        const newIsDark = !isDarkMode;
        const newMode = newIsDark ? 'dark' : 'light';
        
        applyTheme(newIsDark);
        set({ isDarkMode: newIsDark, mode: newMode });
      },

      initializeTheme: () => {
        const { mode } = get();
        let isDark = false;
        
        if (mode === 'dark') {
          isDark = true;
        } else if (mode === 'light') {
          isDark = false;
        } else {
          isDark = getSystemPreference();
        }
        
        applyTheme(isDark);
        set({ isDarkMode: isDark });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(getPersistStorage),
      partialize: (state) => ({ mode: state.mode, isDarkMode: state.isDarkMode }),
    }
  )
);

export default useThemeStore;
