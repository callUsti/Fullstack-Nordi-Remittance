// ============================================================================
// THEME TOGGLE — React Native Theme Switcher
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sun, Moon, Monitor } from 'lucide-react-native';
import { cn } from '@utils/cn';
import useThemeStore, { type ThemeMode } from '@nordi/shared/store/theme.store';

interface ThemeToggleProps {
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className,
  showLabel = false,
}) => {
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  return (
    <TouchableOpacity
      onPress={toggleDarkMode}
      className={cn(
        'flex-row items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800',
        className
      )}
      accessibilityLabel={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun size={20} color="#FBBF24" />
      ) : (
        <Moon size={20} color="#2563EB" />
      )}
      {showLabel && (
        <Text className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default ThemeToggle;
