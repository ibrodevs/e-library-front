import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AppTheme } from '../../theme';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Не удалось загрузить данные.',
  onRetry,
}: ErrorStateProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <AppText style={styles.center} variant="h2">
        Что-то пошло не так
      </AppText>
      <AppText color={theme.colors.textSecondary} style={styles.center}>
        {message}
      </AppText>
      {onRetry ? <AppButton title="Попробовать снова" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.md,
      paddingVertical: theme.spacing['2xl'],
      alignItems: 'center',
    },
    center: {
      textAlign: 'center',
    },
  });
}
