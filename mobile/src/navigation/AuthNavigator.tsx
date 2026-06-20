import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { useAppTheme } from '../hooks/useAppTheme';
import type { AuthStackParamList } from '../types/navigation';
import { createModalScreenOptions } from '../utils/screenOptions';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const { theme } = useAppTheme();
  const screenOptions = useMemo(() => createModalScreenOptions(theme), [theme]);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen component={LoginScreen} name="Login" options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
