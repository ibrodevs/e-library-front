import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';
import { AuthProvider } from './store/authStore';
import { BookmarksProvider } from './store/bookmarksStore';
import { ReadingProgressProvider } from './store/readingProgressStore';
import { AppThemeProvider } from './store/themeStore';
import { useAppTheme } from './hooks/useAppTheme';
import { installWebInputReset } from './utils/webInputReset';

function ThemedAppShell() {
  const { mode, theme } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AuthProvider>
        <ReadingProgressProvider>
          <BookmarksProvider>
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
            <RootNavigator />
          </BookmarksProvider>
        </ReadingProgressProvider>
      </AuthProvider>
    </View>
  );
}

export default function App() {
  useEffect(() => {
    installWebInputReset();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <ThemedAppShell />
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
