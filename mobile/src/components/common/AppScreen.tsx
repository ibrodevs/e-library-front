import { useMemo, type ReactNode } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AppTheme } from '../../theme';

interface AppScreenProps {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
}

export function AppScreen({
  children,
  contentContainerStyle,
  scrollable = false,
  scrollProps,
  style,
}: AppScreenProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentContainerStyle]}>{children}</View>
  );

  return <SafeAreaView style={[styles.safeArea, style]}>{content}</SafeAreaView>;
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    scrollContent: {
      flexGrow: 1,
      padding: theme.spacing.lg,
    },
  });
}
