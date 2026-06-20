import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AppTheme } from '../../theme';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Загрузка...' }: LoadingStateProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <AppText color={theme.colors.textSecondary}>{message}</AppText>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing['2xl'],
    },
  });
}
