import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { SectionCard } from '../../components/layout/SectionCard';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AppTheme } from '../../theme';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AppScreen scrollable contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconTile}>
          <Ionicons color={theme.colors.primary} name="library-outline" size={30} />
        </View>
        <AppText style={styles.center} variant="h1">
          Электронная библиотека колледжа
        </AppText>
        <AppText color={theme.colors.textSecondary} style={styles.center}>
          Учебные книги, закладки и профиль доступны после входа в аккаунт.
        </AppText>
      </View>

      <SectionCard>
        <View style={styles.cardContent}>
          <AppText variant="title">Каталог учебных материалов</AppText>
          <AppText color={theme.colors.textSecondary}>
            Откройте каталог, чтобы найти книгу по названию, автору или описанию.
          </AppText>
          <AppButton
            onPress={() => navigation.navigate('Catalog')}
            rightSlot={<Ionicons color={theme.colors.primaryText} name="arrow-forward-outline" size={17} />}
            title="Открыть каталог"
          />
        </View>
      </SectionCard>
    </AppScreen>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.lg,
      justifyContent: 'center',
      paddingBottom: 120,
    },
    header: {
      gap: theme.spacing.sm,
      alignItems: 'center',
    },
    iconTile: {
      width: 64,
      height: 64,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardContent: {
      gap: theme.spacing.md,
    },
    center: {
      textAlign: 'center',
    },
  });
}
