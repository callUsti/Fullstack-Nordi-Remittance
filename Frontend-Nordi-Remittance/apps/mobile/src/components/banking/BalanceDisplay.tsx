// ============================================================================
// BALANCE DISPLAY - Currency formatted balance with privacy hide/reveal
// ============================================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { cn } from '@utils/cn';

// ========================
// TYPES
// ========================
export type BalanceSize = 'sm' | 'md' | 'lg' | 'xl';
export type BalanceVariant = 'default' | 'positive' | 'negative' | 'muted';

export interface BalanceDisplayProps {
  amount: number;
  currency?: string;
  currencySymbol?: string;
  size?: BalanceSize;
  variant?: BalanceVariant;
  showSymbol?: boolean;
  showCurrency?: boolean;
  hideable?: boolean;
  hidden?: boolean;
  onToggleVisibility?: () => void;
  label?: string;
  className?: string;
}

// ========================
// SIZE CONFIG
// ========================
const sizeStyles: Record<
  BalanceSize,
  { amount: string; currency: string; label: string; icon: number }
> = {
  sm: { amount: 'text-xl font-bold', currency: 'text-xs', label: 'text-xs', icon: 16 },
  md: { amount: 'text-2xl font-extrabold', currency: 'text-sm', label: 'text-xs', icon: 18 },
  lg: { amount: 'text-3xl font-extrabold', currency: 'text-base', label: 'text-sm', icon: 20 },
  xl: { amount: 'text-4xl font-extrabold', currency: 'text-lg', label: 'text-sm', icon: 22 },
};

const variantColors: Record<BalanceVariant, string> = {
  default: 'text-neutral-900 dark:text-white',
  positive: 'text-success-600 dark:text-success-400',
  negative: 'text-error-600 dark:text-error-400',
  muted: 'text-neutral-500 dark:text-neutral-400',
};

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  amount,
  currency = 'USD',
  currencySymbol = '$',
  size = 'lg',
  variant = 'default',
  showSymbol = true,
  showCurrency = true,
  hideable = true,
  hidden: controlledHidden,
  onToggleVisibility,
  label,
  className,
}) => {
  const [internalHidden, setInternalHidden] = useState(false);

  const isHidden = controlledHidden !== undefined ? controlledHidden : internalHidden;

  const handleToggle = () => {
    if (onToggleVisibility) {
      onToggleVisibility();
    } else {
      setInternalHidden(!internalHidden);
    }
  };

  const formattedAmount = isHidden
    ? '••••••'
    : new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);

  const config = sizeStyles[size];

  return (
    <View className={cn('items-start', className)}>
      {label && (
        <View className="flex-row items-center mb-1">
          <Text className={cn('text-neutral-500 dark:text-neutral-400 font-medium', config.label)}>
            {label}
          </Text>
        </View>
      )}

      <View className="flex-row items-center">
        <Text
          className={cn(
            'tracking-tight font-mono',
            config.amount,
            variantColors[variant],
          )}
        >
          {showSymbol && !isHidden && currencySymbol}
          {formattedAmount}
        </Text>

        {showCurrency && !isHidden && (
          <Text
            className={cn(
              'ml-1.5 font-bold text-neutral-400 dark:text-neutral-500 self-baseline',
              config.currency,
            )}
          >
            {currency}
          </Text>
        )}

        {hideable && (
          <TouchableOpacity
            onPress={handleToggle}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="ml-3 p-1 rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            {isHidden ? (
              <EyeOff size={config.icon} color="#64748B" />
            ) : (
              <Eye size={config.icon} color="#64748B" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default BalanceDisplay;
