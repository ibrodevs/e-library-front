import { darkColors, lightColors, type ThemeMode } from './colors';
import { radius, spacing } from './spacing';
import { createShadows } from './shadows';
import { typography } from './typography';

export function createAppTheme(mode: ThemeMode) {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    typography,
    shadows: createShadows(mode),
  } as const;
}

export const lightTheme = createAppTheme('light');
export const darkTheme = createAppTheme('dark');
export const theme = lightTheme;

export type { AppColors, ThemeMode } from './colors';
export type AppTheme = ReturnType<typeof createAppTheme>;
