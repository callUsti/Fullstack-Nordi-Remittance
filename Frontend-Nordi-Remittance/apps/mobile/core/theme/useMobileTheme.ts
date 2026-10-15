import useThemeStore from '@nordi/shared/store/theme.store';

export interface MobileThemeColorSet {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
  primarySoft: string;
  iconMuted: string;
  danger: string;
  dangerSoft: string;
  error: string;
  success: string;
  warning: string;
}

export interface MobileThemeColors extends MobileThemeColorSet {
  isDark: boolean;
  colors: MobileThemeColorSet;
}

export function useMobileTheme(): MobileThemeColors {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  const darkSet: MobileThemeColorSet = {
    background: '#020617',
    surface: '#0F172A',
    surfaceAlt: '#1E293B',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    primary: '#60A5FA',
    primarySoft: '#172554',
    iconMuted: '#94A3B8',
    danger: '#F87171',
    dangerSoft: '#450A0A',
    error: '#F87171',
    success: '#10B981',
    warning: '#F59E0B',
  };

  const lightSet: MobileThemeColorSet = {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    text: '#1F2937',
    textMuted: '#64748B',
    textPrimary: '#1F2937',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    primary: '#2563EB',
    primarySoft: '#EFF6FF',
    iconMuted: '#64748B',
    danger: '#DC2626',
    dangerSoft: '#FEF2F2',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
  };

  const currentSet = isDarkMode ? darkSet : lightSet;

  return {
    isDark: isDarkMode,
    ...currentSet,
    colors: currentSet,
  };
}

