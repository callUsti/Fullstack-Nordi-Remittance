import useThemeStore from '@nordi/shared/store/theme.store';

export interface MobileThemeColors {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primarySoft: string;
  iconMuted: string;
  danger: string;
  dangerSoft: string;
}

export function useMobileTheme(): MobileThemeColors {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  return isDarkMode
    ? {
        isDark: true,
        background: '#020617',
        surface: '#0F172A',
        surfaceAlt: '#1E293B',
        text: '#F8FAFC',
        textMuted: '#94A3B8',
        border: '#334155',
        primary: '#60A5FA',
        primarySoft: '#172554',
        iconMuted: '#94A3B8',
        danger: '#F87171',
        dangerSoft: '#450A0A',
      }
    : {
        isDark: false,
        background: '#F8FAFC',
        surface: '#FFFFFF',
        surfaceAlt: '#F1F5F9',
        text: '#1F2937',
        textMuted: '#64748B',
        border: '#E2E8F0',
        primary: '#2563EB',
        primarySoft: '#EFF6FF',
        iconMuted: '#64748B',
        danger: '#DC2626',
        dangerSoft: '#FEF2F2',
      };
}
