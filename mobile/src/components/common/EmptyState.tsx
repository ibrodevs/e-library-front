import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AppTheme } from '../../theme';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = 'Пока пусто',
  description = 'Здесь появятся данные после загрузки.',
}: EmptyStateProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons color={theme.colors.primary} name="book-outline" size={26} />
      </View>
      <AppText style={styles.center} variant="h2">
        {title}
      </AppText>
      <AppText color={theme.colors.textSecondary} style={styles.center}>
        {description}
      </AppText>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing['2xl'],
      alignItems: 'center',
    },
    iconWrap: {
      width: 54,
      height: 54,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    center: {
      textAlign: 'center',
    },
  });
}
