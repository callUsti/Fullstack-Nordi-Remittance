// ============================================================================
// KYC STATUS BANNER - Verification tier & document completion status card
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import { Badge } from '@components/ui/Badge';
import { cn } from '@utils/cn';

export type KycStatus = 'verified' | 'pending' | 'action_required' | 'unverified';

export interface KycStatusBannerProps {
  status: KycStatus;
  tier?: 1 | 2 | 3;
  dailyLimit?: string;
  completedSteps?: number;
  totalSteps?: number;
  onPress?: () => void;
  className?: string;
}

const statusConfig: Record<
  KycStatus,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
    badgeVariant: 'success' | 'warning' | 'error' | 'default';
    badgeLabel: string;
    bgStyle: string;
  }
> = {
  verified: {
    title: 'Identity Verified (Tier 2)',
    description: 'Higher limits unlocked for international remittance.',
    icon: <ShieldCheck size={22} color="#10B981" />,
    badgeVariant: 'success',
    badgeLabel: 'Verified',
    bgStyle: 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  },
  pending: {
    title: 'Verification In Review',
    description: 'Documents submitted. Review typically takes 15 minutes.',
    icon: <Clock size={22} color="#F59E0B" />,
    badgeVariant: 'warning',
    badgeLabel: 'Under Review',
    bgStyle: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  },
  action_required: {
    title: 'Action Required',
    description: 'A document was rejected. Please re-upload your proof of address.',
    icon: <AlertTriangle size={22} color="#EF4444" />,
    badgeVariant: 'error',
    badgeLabel: 'Action Required',
    bgStyle: 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  },
  unverified: {
    title: 'Upgrade Account Limits',
    description: 'Complete KYC verification to send up to $50,000/day.',
    icon: <ShieldAlert size={22} color="#3B82F6" />,
    badgeVariant: 'default',
    badgeLabel: 'Tier 1 Basic',
    bgStyle: 'bg-primary-50/80 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800',
  },
};

export const KycStatusBanner: React.FC<KycStatusBannerProps> = ({
  status = 'unverified',
  tier = 1,
  dailyLimit = '$500/day',
  completedSteps = 1,
  totalSteps = 3,
  onPress,
  className,
}) => {
  const config = statusConfig[status];
  const progressPercent = Math.min(
    100,
    Math.round((completedSteps / totalSteps) * 100),
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className={cn(
        'w-full p-4.5 rounded-3xl border shadow-sm mb-4',
        config.bgStyle,
        className,
      )}
    >
      {/* Top Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          {config.icon}
          <Text className="ml-2.5 text-sm font-bold text-neutral-900 dark:text-white">
            {config.title}
          </Text>
        </View>

        <Badge variant={config.badgeVariant} size="xs">
          {config.badgeLabel}
        </Badge>
      </View>

      {/* Description */}
      <Text className="text-xs text-neutral-600 dark:text-neutral-300 mb-3">
        {config.description}
      </Text>

      {/* Progress Bar (when not fully verified) */}
      {status !== 'verified' && (
        <View className="my-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[11px] font-semibold text-neutral-500">
              Steps Completed ({completedSteps}/{totalSteps})
            </Text>
            <Text className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
              {progressPercent}%
            </Text>
          </View>

          <View className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <View
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-primary-600 rounded-full"
            />
          </View>
        </View>
      )}

      {/* Bottom CTA */}
      <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-black/5 dark:border-white/5">
        <Text className="text-xs text-neutral-500 font-medium">
          Current Limit: <Text className="font-bold text-neutral-800 dark:text-neutral-200">{dailyLimit}</Text>
        </Text>

        <View className="flex-row items-center">
          <Text className="text-xs font-bold text-primary-600 dark:text-primary-400 mr-1">
            {status === 'verified' ? 'View Limits' : 'Complete Verification'}
          </Text>
          <ChevronRight size={14} color="#2563EB" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default KycStatusBanner;
