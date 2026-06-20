import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { AppText } from '../../components/common/AppText';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AppTheme } from '../../theme';

export function LoginScreen() {
  const { clearError, error, isLoading, login } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  useEffect(() => {
    clearError();
  }, [email, password]);

  const validate = () => {
    let isValid = true;

    if (!email.trim()) {
      setEmailError('Введите email.');
      isValid = false;
    } else {
      setEmailError(undefined);
    }

    if (!password.trim()) {
      setPasswordError('Введите пароль.');
      isValid = false;
    } else {
      setPasswordError(undefined);
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    try {
      await login(email.trim(), password);
    } catch {
      // Error text is already stored in auth context.
    }
  };

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.decor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.iconTile}>
              <Ionicons color={theme.colors.primaryText} name="library-outline" size={30} />
            </View>

            <View style={styles.header}>
              <AppText style={styles.title} variant="h1">
                Вход в электронную библиотеку
              </AppText>
              <AppText color={theme.colors.textSecondary} style={styles.subtitle}>
                Введите данные учётной записи, выданные администрацией колледжа
              </AppText>
            </View>

            <View style={styles.form}>
              <AppInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!isLoading}
                error={emailError}
                keyboardType="email-address"
                label="Email"
                onChangeText={setEmail}
                placeholder="student@example.com"
                textContentType="username"
                value={email}
              />

              <AppInput
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                editable={!isLoading}
                error={passwordError}
                label="Пароль"
                onChangeText={setPassword}
                placeholder="Введите пароль"
                secureTextEntry
                textContentType="password"
                value={password}
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons color={theme.colors.danger} name="alert-circle-outline" size={18} />
                  <AppText color={theme.colors.danger} style={styles.messageText} variant="bodySmall">
                    {error}
                  </AppText>
                </View>
              ) : null}

              <AppButton
                disabled={isLoading}
                onPress={() => void handleLogin()}
                rightSlot={
                  isLoading ? <ActivityIndicator color={theme.colors.primaryText} size="small" /> : null
                }
                title={isLoading ? 'Входим...' : 'Войти'}
              />

              <AppText color={theme.colors.textMuted} style={styles.footerText} variant="bodySmall">
                Доступ предоставляется администрацией колледжа
              </AppText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    decor: {
      position: 'absolute',
      top: -120,
      alignSelf: 'center',
      width: 320,
      height: 320,
      borderRadius: 160,
      backgroundColor: theme.colors.primarySoft,
      opacity: theme.mode === 'dark' ? 0.34 : 0.7,
    },
    keyboardContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing['2xl'],
    },
    card: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 430,
      borderRadius: theme.radius.xl,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing['2xl'],
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.raised,
    },
    iconTile: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 64,
      height: 64,
      borderRadius: theme.radius.lg,
      alignSelf: 'center',
      marginBottom: theme.spacing.xl,
      backgroundColor: theme.mode === 'dark' ? theme.colors.primary : '#1D4ED8',
    },
    header: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    title: {
      textAlign: 'center',
    },
    subtitle: {
      textAlign: 'center',
    },
    form: {
      gap: theme.spacing.md,
    },
    errorBox: {
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.mode === 'dark' ? theme.colors.dangerSoft : '#FECACA',
      backgroundColor: theme.colors.dangerSoft,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    messageText: {
      flex: 1,
    },
    footerText: {
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
  });
}
