import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AppTheme } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  rightSlot?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  title,
  onPress,
  disabled = false,
  rightSlot,
  style,
  variant = 'primary',
}: AppButtonProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const variantStyle = styles[variant];
  const textColor =
    variant === 'primary' || variant === 'danger'
      ? theme.colors.primaryText
      : variant === 'ghost'
        ? theme.colors.textSecondary
        : theme.colors.primary;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <View style={styles.content}>
        <AppText color={textColor} style={styles.title} variant="label">
          {title}
        </AppText>
        {rightSlot}
      </View>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    base: {
      minHeight: 48,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      borderWidth: 1,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
    },
    title: {
      fontWeight: '700',
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.84,
    },
    disabled: {
      opacity: 0.5,
    },
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    ghost: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    danger: {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.danger,
    },
  });
}
