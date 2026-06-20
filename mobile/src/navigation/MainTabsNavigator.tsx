import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookmarksScreen } from '../screens/bookmarks/BookmarksScreen';
import { CatalogScreen } from '../screens/catalog/CatalogScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useAppTheme } from '../hooks/useAppTheme';
import type { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabsNavigator() {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.tabBar,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      height: 58 + Math.max(insets.bottom, 8),
      paddingTop: 6,
      paddingBottom: Math.max(insets.bottom, 8),
      shadowColor: theme.mode === 'dark' ? '#000000' : '#0F172A',
      shadowOpacity: theme.mode === 'dark' ? 0.24 : 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -4 },
      elevation: 8,
    }),
    [insets.bottom, theme]
  );

  return (
    <Tab.Navigator
      initialRouteName="Catalog"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: theme.typography.label.fontFamily,
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Catalog: 'library-outline',
            Bookmarks: 'bookmark-outline',
            Profile: 'person-outline',
          };

          return <Ionicons color={color} name={iconMap[route.name]} size={size} />;
        },
      })}
    >
      <Tab.Screen component={CatalogScreen} name="Catalog" options={{ title: 'Каталог' }} />
      <Tab.Screen component={BookmarksScreen} name="Bookmarks" options={{ title: 'Закладки' }} />
      <Tab.Screen component={ProfileScreen} name="Profile" options={{ title: 'Профиль' }} />
    </Tab.Navigator>
  );
}
