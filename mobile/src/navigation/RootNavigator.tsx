import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { MainTabsNavigator } from './MainTabsNavigator';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../hooks/useAppTheme';
import type { AppTheme } from '../theme';
import type { RootStackParamList } from '../types/navigation';
import { createModalScreenOptions } from '../utils/screenOptions';
import { BookDetailsScreen } from '../screens/reader/BookDetailsScreen';
import { BookReaderScreen } from '../screens/reader/BookReaderScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function createNavigationTheme(theme: AppTheme): Theme {
  const baseTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...baseTheme,
    dark: theme.mode === 'dark',
    colors: {
      ...baseTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      border: theme.colors.border,
      primary: theme.colors.primary,
      text: theme.colors.textPrimary,
      notification: theme.colors.primary,
    },
  };
}

function SplashScreen() {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
      }}
    >
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </View>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useAppTheme();
  const navigationTheme = useMemo(() => createNavigationTheme(theme), [theme]);
  const screenOptions = useMemo(() => createModalScreenOptions(theme), [theme]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={screenOptions}>
        {isAuthenticated ? (
          <>
            <Stack.Screen component={MainTabsNavigator} name="MainTabs" options={{ headerShown: false }} />
            <Stack.Screen component={BookDetailsScreen} name="BookDetails" options={{ headerShown: false }} />
            <Stack.Screen component={BookReaderScreen} name="BookReader" options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen component={AuthNavigator} name="AuthStack" options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
