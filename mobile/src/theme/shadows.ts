import { Platform } from 'react-native';
import type { ThemeMode } from './colors';

function nativeShadow(color: string, opacity: number, radius: number, height: number, elevation: number) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

export function createShadows(mode: ThemeMode) {
  const subtleColor = mode === 'dark' ? '#000000' : '#0F172A';

  return {
    card: Platform.select({
      web: {
        boxShadow: mode === 'dark' ? '0px 10px 24px rgba(0, 0, 0, 0.22)' : '0px 8px 18px rgba(15, 23, 42, 0.06)',
      } as any,
      default: nativeShadow(subtleColor, mode === 'dark' ? 0.2 : 0.06, 14, 5, 2),
    }),
    raised: Platform.select({
      web: {
        boxShadow: mode === 'dark' ? '0px 14px 32px rgba(0, 0, 0, 0.26)' : '0px 16px 32px rgba(15, 23, 42, 0.08)',
      } as any,
      default: nativeShadow(subtleColor, mode === 'dark' ? 0.24 : 0.08, 18, 8, 4),
    }),
    none: {},
  } as const;
}

export const shadows = createShadows('light');
