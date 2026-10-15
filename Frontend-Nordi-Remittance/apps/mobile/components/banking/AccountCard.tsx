// ============================================================================
// ACCOUNT CARD - Bank account display card with balance and quick actions
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import {
  Wallet,
  CreditCard,
  Building,
  PiggyBank,
  TrendingUp,
  Copy,
  ChevronRight,
} from 'lucide-react-native';
import { Badge } from '@components/ui/Badge';
import { cn } from '@utils/cn';

// ========================
// TYPES
// ========================
export type AccountType = 'savings' | 'checking' | 'business' | 'investment' | 'credit';
export type AccountStatus = 'active' | 'frozen' | 'pending' | 'closed';

export interface AccountCardProps {
  id?: string;
  name?: string;
  accountNumber?: string;
  balance?: number;
  currency?: string;
  type?: AccountType;
  status?: AccountStatus;
  isPrimary?: boolean;
  account?: {
    id?: string;
    name?: string;
    accountNumber?: string;
    balance?: number;
    currency?: string;
    type?: any;
    status?: any;
    isPrimary?: boolean;
  };
  lastTransaction?: {
    date: string;
    amount: number;
    type: 'credit' | 'debit';
  };
  onPress?: () => void;
  onClick?: () => void;
  onCopyAccountNumber?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

// ========================
// CONFIG
// ========================
const accountTypeConfig: Record<
  AccountType,
  {
    icon: (color: string) => React.ReactNode;
    label: string;
    gradientColors: readonly [string, string];
  }
> = {
  savings: {
    icon: (color) => <PiggyBank size={20} color={color} />,
    label: 'Savings',
    gradientColors: ['#059669', '#0f766e'],
  },
  checking: {
    icon: (color) => <Wallet size={20} color={color} />,
    label: 'Checking',
    gradientColors: ['#1E3A8A', '#2563EB'],
  },
  business: {
    icon: (color) => <Building size={20} color={color} />,
    label: 'Business',
    gradientColors: ['#6D28D9', '#4F46E5'],
  },
  investment: {
    icon: (color) => <TrendingUp size={20} color={color} />,
    label: 'Investment',
    gradientColors: ['#D97706', '#EA580C'],
  },
  credit: {
    icon: (color) => <CreditCard size={20} color={color} />,
    label: 'Credit',
    gradientColors: ['#E11D48', '#BE123C'],
  },
};

const statusConfig: Record<
  AccountStatus,
  { label: string; variant: 'success' | 'warning' | 'error' | 'default' }
> = {
  active: { label: 'Active', variant: 'success' },
  frozen: { label: 'Frozen', variant: 'error' },
  pending: { label: 'Pending', variant: 'warning' },
  closed: { label: 'Closed', variant: 'default' },
};

export const AccountCard: React.FC<AccountCardProps> = (props) => {
  const merged = props.account ? { ...props.account, ...props } : props;
  const name = merged.name || 'Account';
  const accountNumber = merged.accountNumber || '••••';
  const balance = merged.balance || 0;
  const currency = merged.currency || 'USD';
  const rawType = (merged.type as AccountType) || 'checking';
  const type = rawType in accountTypeConfig ? rawType : 'checking';
  const rawStatus = (merged.status as AccountStatus) || 'active';
  const status = rawStatus in statusConfig ? rawStatus : 'active';
  const isPrimary = !!merged.isPrimary;
  const { onPress, onClick, onCopyAccountNumber, onViewDetails, className } = props;
  const typeInfo = accountTypeConfig[type] || accountTypeConfig.checking;
  const statusInfo = statusConfig[status];

  const handleCopy = async () => {
    await Clipboard.setStringAsync(accountNumber);
    if (onCopyAccountNumber) {
      onCopyAccountNumber();
    }
  };

  const handlePress = onPress || onClick || onViewDetails;

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(balance);

  const maskedNumber =
    accountNumber.length > 4
      ? `•••• ${accountNumber.slice(-4)}`
      : accountNumber;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      className={cn('mb-4 w-full rounded-3xl overflow-hidden shadow-lg shadow-black/10', className)}
    >
      <LinearGradient
        colors={typeInfo.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5"
      >
        {/* Top Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center space-x-2">
            <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center mr-2">
              {typeInfo.icon('#FFFFFF')}
            </View>
            <View>
              <Text className="text-white/80 text-xs font-medium uppercase tracking-wider">
                {typeInfo.label}
              </Text>
              <Text className="text-white font-bold text-base">{name}</Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2">
            {isPrimary && (
              <View className="bg-amber-400/90 px-2 py-0.5 rounded-full mr-1.5">
                <Text className="text-amber-950 font-extrabold text-[10px] uppercase">
                  Primary
                </Text>
              </View>
            )}
            <Badge variant={statusInfo.variant} size="xs">
              {statusInfo.label}
            </Badge>
          </View>
        </View>

        {/* Balance Display */}
        <View className="my-2">
          <Text className="text-white/70 text-xs font-medium">Available Balance</Text>
          <Text className="text-white font-extrabold text-3xl tracking-tight mt-0.5">
            {formattedBalance}
          </Text>
        </View>

        {/* Footer Details */}
        <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-white/15">
          <TouchableOpacity
            onPress={handleCopy}
            className="flex-row items-center bg-black/20 px-3 py-1.5 rounded-xl"
          >
            <Text className="text-white/90 text-xs font-mono mr-2">
              {maskedNumber}
            </Text>
            <Copy size={13} color="#FFFFFF" />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <Text className="text-white/80 text-xs font-semibold mr-1">Details</Text>
            <ChevronRight size={16} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default AccountCard;
