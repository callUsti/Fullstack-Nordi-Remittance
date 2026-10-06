// ============================================================================
// FEATURE CARD & QUICK ACTIONS - Native mobile action card for banking dashboard
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Badge } from '@components/ui/Badge';
import { cn } from '@utils/cn';

// ========================
// TYPES
// ========================
export type FeatureCardVariant = 'default' | 'outlined' | 'filled' | 'primary';
export type FeatureCardSize = 'sm' | 'md' | 'lg';

export interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: FeatureCardVariant;
  size?: FeatureCardSize;
  badge?: string;
  onPress?: () => void;
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<FeatureCardVariant, string> = {
  default:
    'bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/60 shadow-sm shadow-neutral-900/5',
  outlined:
    'bg-transparent border-2 border-neutral-200 dark:border-neutral-700',
  filled:
    'bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/60',
  primary:
    'bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/60',
};

const sizeStyles: Record<
  FeatureCardSize,
  { padding: string; iconBox: string; title: string; desc: string }
> = {
  sm: {
    padding: 'p-3.5 rounded-2xl',
    iconBox: 'w-10 h-10 rounded-xl mb-2.5',
    title: 'text-sm font-bold',
    desc: 'text-xs mt-0.5',
  },
  md: {
    padding: 'p-4 rounded-2xl',
    iconBox: 'w-12 h-12 rounded-2xl mb-3',
    title: 'text-base font-bold',
    desc: 'text-xs mt-1',
  },
  lg: {
    padding: 'p-5 rounded-3xl',
    iconBox: 'w-14 h-14 rounded-2xl mb-3.5',
    title: 'text-lg font-bold',
    desc: 'text-sm mt-1.5',
  },
};

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  variant = 'default',
  size = 'md',
  badge,
  onPress,
  onClick,
  className,
}) => {
  const config = sizeStyles[size];
  const handlePress = onPress || onClick;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      className={cn(
        'w-full mb-3 justify-between',
        variantStyles[variant],
        config.padding,
        className,
      )}
    >
      <View>
        <View className="flex-row items-center justify-between">
          {icon && (
            <View
              className={cn(
                'items-center justify-center bg-primary-100 dark:bg-primary-900/40',
                config.iconBox,
              )}
            >
              {icon}
            </View>
          )}

          {badge && (
            <Badge variant="primary" size="xs">
              {badge}
            </Badge>
          )}
        </View>

        <Text className={cn('text-neutral-900 dark:text-white', config.title)}>
          {title}
        </Text>
        <Text
          numberOfLines={2}
          className={cn('text-neutral-500 dark:text-neutral-400', config.desc)}
        >
          {description}
        </Text>
      </View>

      <View className="flex-row items-center justify-end mt-3">
        <ChevronRight size={16} color="#3B82F6" />
      </View>
    </TouchableOpacity>
  );
};

// ========================
// QUICK ACTION BUTTON (Circle Icon + Label)
// ========================
export interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
  badge?: string;
  className?: string;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  label,
  icon,
  onPress,
  badge,
  className,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className={cn('items-center justify-center p-2', className)}
    >
      <View className="relative">
        <View className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/40 border border-primary-100 dark:border-primary-800 items-center justify-center shadow-sm shadow-primary-500/10 active:scale-95">
          {icon}
        </View>
        {badge && (
          <View className="absolute -top-1 -right-1 bg-secondary-500 px-1.5 py-0.5 rounded-full">
            <Text className="text-white text-[9px] font-extrabold uppercase">
              {badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mt-2 text-center"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default FeatureCard;
