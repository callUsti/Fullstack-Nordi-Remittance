// ============================================================================
// TRANSACTION ITEM - Native list item for financial transactions
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Repeat,
  RotateCcw,
  ShoppingBag,
  Utensils,
  Car,
  Plane,
  Heart,
  Gift,
  Smartphone,
  CreditCard,
  Building,
  Briefcase,
  Zap,
} from 'lucide-react-native';
import { StatusBadge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { cn } from '@utils/cn';

// ========================
// TYPES
// ========================
export type TransactionType = 'credit' | 'debit' | 'transfer' | 'refund';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'processing';
export type TransactionCategory =
  | 'shopping'
  | 'food'
  | 'transport'
  | 'travel'
  | 'housing'
  | 'health'
  | 'entertainment'
  | 'gift'
  | 'transfer'
  | 'salary'
  | 'utilities'
  | 'other';

export interface TransactionItemProps {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  type: TransactionType;
  status?: TransactionStatus;
  category?: TransactionCategory;
  date: string;
  time?: string;
  recipientName?: string;
  recipientAvatar?: string;
  onPress?: () => void;
  onClick?: () => void;
  className?: string;
}

// ========================
// CATEGORY ICONS
// ========================
const getCategoryIcon = (category?: TransactionCategory, type?: TransactionType) => {
  const iconSize = 18;
  const iconColor = '#1E3A8A';

  switch (category) {
    case 'shopping':
      return <ShoppingBag size={iconSize} color={iconColor} />;
    case 'food':
      return <Utensils size={iconSize} color={iconColor} />;
    case 'transport':
      return <Car size={iconSize} color={iconColor} />;
    case 'travel':
      return <Plane size={iconSize} color={iconColor} />;
    case 'health':
      return <Heart size={iconSize} color={iconColor} />;
    case 'entertainment':
    case 'gift':
      return <Gift size={iconSize} color={iconColor} />;
    case 'salary':
      return <Briefcase size={iconSize} color={iconColor} />;
    case 'utilities':
      return <Zap size={iconSize} color={iconColor} />;
    case 'housing':
      return <Building size={iconSize} color={iconColor} />;
    default:
      if (type === 'credit') return <ArrowDownLeft size={iconSize} color="#10B981" />;
      if (type === 'transfer') return <Repeat size={iconSize} color="#6366F1" />;
      if (type === 'refund') return <RotateCcw size={iconSize} color="#10B981" />;
      return <ArrowUpRight size={iconSize} color="#EF4444" />;
  }
};

export const TransactionItem: React.FC<TransactionItemProps> = ({
  title,
  description,
  amount,
  currency = 'USD',
  type = 'debit',
  status = 'completed',
  category,
  date,
  time,
  recipientName,
  recipientAvatar,
  onPress,
  onClick,
  className,
}) => {
  const isCredit = type === 'credit' || type === 'refund';
  const handlePress = onPress || onClick;

  const formattedAmount = `${isCredit ? '+' : '-'}${new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    },
  ).format(Math.abs(amount))}`;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      className={cn(
        'flex-row items-center justify-between py-3.5 px-4 my-1 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-100 dark:border-neutral-700/60 shadow-sm shadow-neutral-900/5',
        className,
      )}
    >
      {/* Left Icon or Avatar */}
      <View className="flex-row items-center flex-1 mr-3">
        {recipientAvatar || recipientName ? (
          <Avatar
            src={recipientAvatar}
            name={recipientName || title}
            size="md"
            className="mr-3"
          />
        ) : (
          <View
            className={cn(
              'w-11 h-11 rounded-2xl items-center justify-center mr-3',
              isCredit
                ? 'bg-success-50 dark:bg-success-950/40'
                : 'bg-primary-50 dark:bg-primary-950/40',
            )}
          >
            {getCategoryIcon(category, type)}
          </View>
        )}

        {/* Title and Timestamp */}
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-sm font-bold text-neutral-900 dark:text-white"
          >
            {title}
          </Text>
          <Text
            numberOfLines={1}
            className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5"
          >
            {description ? description : `${date}${time ? ` • ${time}` : ''}`}
          </Text>
        </View>
      </View>

      {/* Right Amount & Status */}
      <View className="items-end">
        <Text
          className={cn(
            'text-sm font-bold font-mono',
            isCredit
              ? 'text-success-600 dark:text-success-400'
              : 'text-neutral-900 dark:text-white',
          )}
        >
          {formattedAmount}
        </Text>

        {status !== 'completed' && (
          <View className="mt-1">
            <StatusBadge status={status} size="xs" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default TransactionItem;
