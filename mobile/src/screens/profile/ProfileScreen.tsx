import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../services/api/profileApi';
import type { AppTheme, ThemeMode } from '../../theme';
import type { UserProfile } from '../../types/auth';

type ProfileField = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

type ProfileRecord = UserProfile & {
  name?: string;
  role?: string;
};

const NOT_SPECIFIED = 'Не указано';

function getStringValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function getDisplayValue(value: unknown): string {
  return getStringValue(value) ?? NOT_SPECIFIED;
}

function resolveProfileSummary(user: UserProfile | null) {
  const record = (user ?? {}) as ProfileRecord;
  const firstName = getStringValue(record.first_name);
  const lastName = getStringValue(record.last_name);
  const joinedName = [firstName, lastName].filter(Boolean).join(' ').trim();

  const fullName =
    [getStringValue(record.full_name), joinedName || null, getStringValue(record.name), getStringValue(record.username)].find(Boolean) ??
    'Пользователь библиотеки';

  return {
    course: getStringValue(record.course),
    email: getStringValue(record.email),
    firstName,
    fullName,
    group: getStringValue(record.group),
    lastName,
    role: getStringValue(record.role) ?? 'Студент',
  };
}

export function ProfileScreen() {
  const { mode, setThemeMode, theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { error, fetchProfile, isLoading, logout, user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  const summary = useMemo(() => resolveProfileSummary(user), [user]);
  const useTwoColumns = width >= 430;

  const infoFields = useMemo<ProfileField[]>(
    () => [
      { icon: 'person-outline', label: 'Имя', value: getDisplayValue(summary.firstName) },
      { icon: 'person-outline', label: 'Фамилия', value: getDisplayValue(summary.lastName) },
      { icon: 'mail-outline', label: 'Email', value: getDisplayValue(summary.email) },
      { icon: 'people-outline', label: 'Группа', value: getDisplayValue(summary.group) },
      { icon: 'school-outline', label: 'Курс', value: getDisplayValue(summary.course) },
      { icon: 'lock-closed-outline', label: 'Пароль', value: '••••••••' },
    ],
    [summary.course, summary.email, summary.firstName, summary.group, summary.lastName]
  );

  const resetPasswordForm = () => {
    setOldPassword('');
    setNewPassword('');
    setRepeatPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword.trim() || !newPassword.trim() || !repeatPassword.trim()) {
      setPasswordError('Заполните все поля.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setPasswordError('Новый пароль должен содержать минимум 6 символов.');
      return;
    }

    if (newPassword !== repeatPassword) {
      setPasswordError('Новый пароль и подтверждение не совпадают.');
      return;
    }

    setIsSavingPassword(true);

    try {
      await changePassword(oldPassword, newPassword);
      resetPasswordForm();
      setPasswordSuccess('Пароль успешно обновлен.');
    } catch (requestError: any) {
      setPasswordError(
        requestError?.response?.data?.detail ||
          requestError?.response?.data?.old_password?.[0] ||
          requestError?.response?.data?.new_password?.[0] ||
          'Не удалось изменить пароль.'
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLogoutPending(true);

    try {
      await logout();
    } finally {
      setLogoutPending(false);
    }
  };

  if (isLoading && !user) {
    return (
      <AppScreen contentContainerStyle={styles.centered}>
        <LoadingState message="Загружаем профиль..." />
      </AppScreen>
    );
  }

  if (error && !user) {
    return (
      <AppScreen contentContainerStyle={styles.centered}>
        <ErrorState message={error} onRetry={() => void fetchProfile()} />
      </AppScreen>
    );
  }

  if (!user) {
    return (
      <AppScreen contentContainerStyle={styles.centered}>
        <EmptyState
          title="Профиль пока недоступен"
          description="После успешного входа здесь появятся данные пользователя."
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scrollable contentContainerStyle={styles.content} style={styles.screen}>
      <LinearGradient colors={['#1D4ED8', '#2563EB', '#0F1A2D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroGrid} />
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.userCard}>
          <View style={styles.userTop}>
            <View style={styles.avatar}>
              <Ionicons color={theme.colors.primaryText} name="person-outline" size={34} />
            </View>

            <View style={styles.userCopy}>
              <AppText numberOfLines={2} style={styles.profileName} variant="title">
                {summary.fullName}
              </AppText>
              <View style={styles.identityRow}>
                <View style={styles.roleBadge}>
                  <Ionicons color={theme.colors.primary} name="school-outline" size={12} />
                  <AppText color={theme.colors.primary} style={styles.roleText} variant="caption">
                    {summary.role}
                  </AppText>
                </View>
                <AppText color={theme.colors.textSecondary} numberOfLines={1} style={styles.emailText} variant="bodySmall">
                  {summary.email ?? 'Email не указан'}
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.userActions}>
            <View style={styles.themeSwitcher}>
              <ThemeOption label="Светлая" mode="light" selectedMode={mode} onSelect={setThemeMode} />
              <ThemeOption label="Темная" mode="dark" selectedMode={mode} onSelect={setThemeMode} />
            </View>

            <AppButton
              disabled={logoutPending}
              onPress={() => void handleLogout()}
              rightSlot={logoutPending ? <ActivityIndicator color={theme.colors.primaryText} size="small" /> : null}
              style={styles.logoutButton}
              title={logoutPending ? 'Выходим...' : 'Выйти'}
              variant="danger"
            />
          </View>
        </View>

        <View style={styles.sectionTitleRow}>
          <Ionicons color={theme.colors.primary} name="id-card-outline" size={20} />
          <AppText style={styles.sectionTitle} variant="title">
            Личные данные
          </AppText>
        </View>

        <View style={styles.infoGrid}>
          {infoFields.map((field) => (
            <View key={field.label} style={[styles.infoCard, useTwoColumns ? styles.infoCardHalf : styles.infoCardFull]}>
              <View style={styles.infoIcon}>
                <Ionicons color={theme.colors.primary} name={field.icon} size={17} />
              </View>
              <View style={styles.infoCopy}>
                <AppText color={theme.colors.textMuted} numberOfLines={1} style={styles.infoLabel} variant="caption">
                  {field.label}
                </AppText>
                <AppText numberOfLines={field.label === 'Email' ? 1 : 2} style={styles.infoValue} variant="bodySmall">
                  {field.value}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.passwordCard}>
          <View style={styles.cardHeader}>
            <View>
              <AppText style={styles.sectionTitle} variant="title">
                Смена пароля
              </AppText>
              <AppText color={theme.colors.textMuted} variant="bodySmall">
                Обновите пароль для входа в библиотеку
              </AppText>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons color={theme.colors.primary} name="lock-closed-outline" size={18} />
            </View>
          </View>

          <View style={styles.passwordForm}>
            <AppInput
              autoCapitalize="none"
              autoCorrect={false}
              label="Текущий пароль"
              onChangeText={(value) => {
                setOldPassword(value);
                setPasswordError(null);
              }}
              placeholder="Введите текущий пароль"
              secureTextEntry
              value={oldPassword}
            />
            <AppInput
              autoCapitalize="none"
              autoCorrect={false}
              label="Новый пароль"
              onChangeText={(value) => {
                setNewPassword(value);
                setPasswordError(null);
              }}
              placeholder="Минимум 6 символов"
              secureTextEntry
              value={newPassword}
            />
            <AppInput
              autoCapitalize="none"
              autoCorrect={false}
              label="Подтвердите новый пароль"
              onChangeText={(value) => {
                setRepeatPassword(value);
                setPasswordError(null);
              }}
              placeholder="Повторите новый пароль"
              secureTextEntry
              value={repeatPassword}
            />

            {passwordError ? (
              <View style={styles.messageBoxError}>
                <Ionicons color={theme.colors.danger} name="alert-circle-outline" size={18} />
                <AppText color={theme.colors.danger} style={styles.messageText} variant="bodySmall">
                  {passwordError}
                </AppText>
              </View>
            ) : null}

            {passwordSuccess ? (
              <View style={styles.messageBoxSuccess}>
                <Ionicons color={theme.colors.success} name="checkmark-circle-outline" size={18} />
                <AppText color={theme.colors.success} style={styles.messageText} variant="bodySmall">
                  {passwordSuccess}
                </AppText>
              </View>
            ) : null}

            <AppButton
              disabled={isSavingPassword}
              onPress={() => void handleChangePassword()}
              rightSlot={isSavingPassword ? <ActivityIndicator color={theme.colors.primaryText} size="small" /> : null}
              title={isSavingPassword ? 'Изменяем...' : 'Изменить пароль'}
            />
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

function ThemeOption({
  label,
  mode,
  selectedMode,
  onSelect,
}: {
  label: string;
  mode: ThemeMode;
  selectedMode: ThemeMode;
  onSelect: (mode: ThemeMode) => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const active = selectedMode === mode;

  return (
    <Pressable
      onPress={() => void onSelect(mode)}
      style={({ pressed }) => [styles.themeOption, active ? styles.themeOptionActive : null, pressed ? styles.pressed : null]}
    >
      <AppText color={active ? theme.colors.primary : theme.colors.textSecondary} style={styles.themeOptionText} variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 0,
      paddingBottom: 118,
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    hero: {
      height: 168,
      overflow: 'hidden',
    },
    heroGrid: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      opacity: theme.mode === 'dark' ? 0.16 : 0.1,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.20)',
    },
    body: {
      gap: theme.spacing.lg,
      marginTop: -58,
      paddingHorizontal: theme.spacing.lg,
    },
    userCard: {
      gap: theme.spacing.lg,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
      ...theme.shadows.raised,
    },
    userTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    avatar: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 74,
      height: 74,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.primary,
      borderWidth: 3,
      borderColor: theme.mode === 'dark' ? '#1B2B46' : '#FFFFFF',
    },
    userCopy: {
      flex: 1,
      gap: theme.spacing.xs,
      minWidth: 0,
    },
    profileName: {
      color: theme.colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 28,
    },
    identityRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    roleBadge: {
      minHeight: 26,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: theme.spacing.sm,
    },
    roleText: {
      fontWeight: '800',
    },
    emailText: {
      flexShrink: 1,
      maxWidth: 220,
    },
    userActions: {
      gap: theme.spacing.sm,
    },
    logoutButton: {
      alignSelf: 'stretch',
    },
    themeSwitcher: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
      padding: theme.spacing.xs,
    },
    themeOption: {
      flex: 1,
      minHeight: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.transparent,
    },
    themeOptionActive: {
      borderColor: theme.colors.primaryBorder,
      backgroundColor: theme.colors.cardElevated,
    },
    themeOptionText: {
      fontWeight: '800',
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      fontWeight: '800',
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    infoCard: {
      minHeight: 82,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      padding: theme.spacing.md,
    },
    infoCardFull: {
      width: '100%',
    },
    infoCardHalf: {
      flexGrow: 1,
      flexBasis: '47%',
    },
    infoIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    infoCopy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    infoLabel: {
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    infoValue: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
    },
    passwordCard: {
      gap: theme.spacing.lg,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    headerIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 42,
      height: 42,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    passwordForm: {
      gap: theme.spacing.md,
    },
    messageBoxError: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.dangerSoft,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    messageBoxSuccess: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.success,
      backgroundColor: theme.colors.successSoft,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    messageText: {
      flex: 1,
    },
    pressed: {
      opacity: 0.82,
    },
  });
}
