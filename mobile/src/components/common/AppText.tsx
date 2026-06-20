import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { AppTheme } from '../../theme';

type Variant = keyof AppTheme['typography'];

interface AppTextProps extends TextProps {
  color?: string;
  style?: StyleProp<TextStyle>;
  variant?: Variant;
}

export function AppText({
  children,
  color,
  style,
  variant = 'body',
  ...rest
}: AppTextProps) {
  const { theme } = useAppTheme();

  return (
    <Text
      {...rest}
      style={[
        theme.typography[variant],
        {
          color: color ?? theme.colors.textPrimary,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
