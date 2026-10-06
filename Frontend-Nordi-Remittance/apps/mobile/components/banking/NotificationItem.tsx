// ============================================================================
// NOTIFICATION ITEM - Rich transaction and security alert notification tile
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Bell,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  FileCheck,
  CreditCard,
  Gift,
} from 'lucide-react-native';
import { cn } from '@utils/cn';

export type NotificationType =
  | 'credit'
  | 'debit'
  | 'security'
  | 'kyc'
  | 'card'
  | 'promo'
  | 'system';

export interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
  onPress?: () => void;
  className?: string;
}

const getNotificationIcon = (type: NotificationType) => {
  const iconSize = 18;
  switch (type) {
    case 'credit':
      return <ArrowDownLeft size={iconSize} color="#10B981" />;
    case 'debit':
      return <ArrowUpRight size={iconSize} color="#EF4444" />;
    case 'security':
      return <ShieldAlert size={iconSize} color="#F59E0B" />;
    case 'kyc':
      return <FileCheck size={iconSize} color="#3B82F6" />;
    case 'card':
      return <CreditCard size={iconSize} color="#8B5CF6" />;
    case 'promo':
      return <Gift size={iconSize} color="#EC4899" />;
    default:
      return <Bell size={iconSize} color="#1E3A8A" />;
  }
};

const getIconBg = (type: NotificationType) => {
  switch (type) {
    case 'credit':
      return 'bg-emerald-50 dark:bg-emerald-950/40';
    case 'debit':
      return 'bg-red-50 dark:bg-red-950/40';
    case 'security':
      return 'bg-amber-50 dark:bg-amber-950/40';
    case 'kyc':
      return 'bg-blue-50 dark:bg-blue-950/40';
    case 'card':
      return 'bg-purple-50 dark:bg-purple-950/40';
    case 'promo':
      return 'bg-pink-50 dark:bg-pink-950/40';
    default:
      return 'bg-primary-50 dark:bg-primary-950/40';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  type,
  title,
  message,
  timestamp,
  isRead = false,
  onPress,
  className,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className={cn(
        'flex-row items-start p-4 my-1 rounded-2xl border shadow-sm',
        isRead
          ? 'bg-white dark:bg-neutral-800/60 border-neutral-100 dark:border-neutral-700/60'
          : 'bg-primary-50/30 dark:bg-primary-950/20 border-primary-200/60 dark:border-primary-800/60',
        className,
      )}
    >
      {/* Icon */}
      <View
        className={cn(
          'w-10 h-10 rounded-xl items-center justify-center mr-3 mt-0.5',
          getIconBg(type),
        )}
      >
        {getNotificationIcon(type)}
      </View>

      {/* Content */}
      <View className="flex-1 mr-2">
        <View className="flex-row items-center justify-between mb-0.5">
          <Text
            numberOfLines={1}
            className={cn(
              'text-sm text-neutral-900 dark:text-white',
              isRead ? 'font-semibold' : 'font-bold',
            )}
          >
            {title}
          </Text>
          <Text className="text-[11px] text-neutral-400 font-medium">
            {timestamp}
          </Text>
        </View>

        <Text
          numberOfLines={2}
          className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed"
        >
          {message}
        </Text>
      </View>

      {/* Unread Indicator Dot */}
      {!isRead && (
        <View className="w-2.5 h-2.5 rounded-full bg-primary-600 dark:bg-primary-400 mt-1.5" />
      )}
    </TouchableOpacity>
  );
};

export default NotificationItem;
