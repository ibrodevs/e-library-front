import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createAppTheme, type AppTheme, type ThemeMode } from '../theme';

const THEME_STORAGE_KEY = 'app_theme_mode';
const DEFAULT_THEME_MODE: ThemeMode = 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  theme: AppTheme;
  isDark: boolean;
  isLoading: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function normalizeMode(value: string | null): ThemeMode {
  return value === 'dark' || value === 'light' ? value : DEFAULT_THEME_MODE;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreTheme() {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (mounted) {
          setMode(normalizeMode(savedMode));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void restoreTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = useCallback(async (nextMode: ThemeMode) => {
    setMode(nextMode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  }, []);

  const toggleTheme = useCallback(async () => {
    await setThemeMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setThemeMode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme,
      isDark: mode === 'dark',
      isLoading,
      setThemeMode,
      toggleTheme,
    }),
    [isLoading, mode, setThemeMode, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppThemeStore() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppThemeStore must be used inside AppThemeProvider');
  }

  return context;
}
