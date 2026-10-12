import { useMobileTheme } from '@/core/theme/useMobileTheme';

export function useThemeColor(
  props: { light?: string; dark?: string } = {},
  colorName: string,
): string {
  const theme = useMobileTheme();
  const colorFromProps = theme.isDark ? props.dark : props.light;

  if (colorFromProps) {
    return colorFromProps;
  }

  const themeRecord = theme as unknown as Record<string, string | boolean>;
  if (typeof themeRecord[colorName] === 'string') {
    return themeRecord[colorName] as string;
  }

  switch (colorName) {
    case 'background':
      return theme.background;
    case 'surface':
      return theme.surface;
    case 'text':
      return theme.text;
    case 'border':
      return theme.border;
    case 'tabBarActive':
      return theme.primary;
    case 'tabBarInactive':
      return theme.iconMuted;
    default:
      return theme.isDark ? '#FFFFFF' : '#000000';
  }
}

export default useThemeColor;
