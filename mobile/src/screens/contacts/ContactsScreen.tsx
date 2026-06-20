import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { SectionCard } from '../../components/layout/SectionCard';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AppTheme } from '../../theme';

export function ContactsScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AppScreen scrollable contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="h1">Контакты</AppText>
        <AppText color={theme.colors.textSecondary}>
          Служебный экран оставлен вне основной навигации мобильного приложения.
        </AppText>
      </View>

      <SectionCard>
        <View style={styles.section}>
          <AppText variant="title">Контактные данные</AppText>
          <AppText color={theme.colors.textSecondary}>
            Блок контактов можно подключить позже, когда будет утверждён мобильный сценарий.
          </AppText>
        </View>
      </SectionCard>
    </AppScreen>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.lg,
      paddingBottom: 120,
    },
    header: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    section: {
      gap: theme.spacing.md,
    },
  });
}
