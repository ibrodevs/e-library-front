import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { theme as defaultTheme, type AppTheme } from '../theme';

export function createModalScreenOptions(theme: AppTheme): NativeStackNavigationOptions {
  return {
    presentation: 'card',
    headerStyle: {
      backgroundColor: theme.colors.surface,
    },
    headerTintColor: theme.colors.textPrimary,
    headerTitleStyle: {
      fontFamily: theme.typography.title.fontFamily,
      fontWeight: '700',
    },
    contentStyle: {
      backgroundColor: theme.colors.background,
    },
  };
}

export const modalScreenOptions = createModalScreenOptions(defaultTheme);
