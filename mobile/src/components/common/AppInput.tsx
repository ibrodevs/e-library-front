import { useMemo, useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from './AppText';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AppTheme } from '../../theme';

interface AppInputProps extends TextInputProps {
  error?: string;
  label?: string;
}

export function AppInput({ error, label, onBlur, onFocus, style, ...rest }: AppInputProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isFocused, setIsFocused] = useState(false);

  const webInputStyle =
    Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
          boxShadow: 'none',
        } as any)
      : null;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText color={theme.colors.textSecondary} variant="label">
          {label}
        </AppText>
      ) : null}
      <TextInput
        cursorColor={theme.colors.primary}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.primary}
        style={[
          styles.input,
          isFocused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          style,
          webInputStyle,
        ]}
        {...rest}
      />
      {error ? (
        <AppText color={theme.colors.danger} variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    wrapper: {
      gap: theme.spacing.xs,
    },
    input: {
      minHeight: 50,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.inputBackground,
      color: theme.colors.textPrimary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontFamily: theme.typography.body.fontFamily,
      fontSize: 16,
    },
    inputFocused: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    inputError: {
      borderColor: theme.colors.danger,
    },
  });
}
