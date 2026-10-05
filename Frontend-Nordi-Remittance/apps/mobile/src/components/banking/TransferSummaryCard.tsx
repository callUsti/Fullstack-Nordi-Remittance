// ============================================================================
// TRANSFER SUMMARY CARD - Comprehensive breakdown for remittance transfers
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  ArrowDown,
  ShieldCheck,
  Clock,
  Building,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { cn } from '@utils/cn';

export interface TransferSummaryCardProps {
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  exchangeRate: number;
  fee: number;
  recipientName: string;
  recipientBank: string;
  recipientAccount: string;
  estimatedDelivery?: string;
  isSecured?: boolean;
  isLoading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const TransferSummaryCard: React.FC<TransferSummaryCardProps> = ({
  sendAmount,
  sendCurrency,
  receiveAmount,
  receiveCurrency,
  exchangeRate,
  fee,
  recipientName,
  recipientBank,
  recipientAccount,
  estimatedDelivery = 'Instant (Within 2 minutes)',
  isSecured = true,
  isLoading = false,
  onConfirm,
  onCancel,
  className,
}) => {
  const totalDebit = sendAmount + fee;

  const formatCurrency = (val: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <View
      className={cn(
        'w-full bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-neutral-100 dark:border-neutral-700 shadow-xl shadow-neutral-900/5',
        className,
      )}
    >
      {/* Security Status Header */}
      <View className="flex-row items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-700/60 mb-4">
        <View className="flex-row items-center">
          <ShieldCheck size={18} color="#10B981" />
          <Text className="ml-1.5 text-xs font-bold text-success-700 dark:text-success-400">
            Guaranteed Rate Protected
          </Text>
        </View>

        <Badge variant="primary" size="xs">
          Remittance Review
        </Badge>
      </View>

      {/* Sending vs Receiving Hero Cards */}
      <View className="bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl p-4 mb-2 border border-neutral-100 dark:border-neutral-800">
        <Text className="text-xs text-neutral-500 font-medium">You Send</Text>
        <Text className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">
          {formatCurrency(sendAmount, sendCurrency)}
        </Text>
      </View>

      {/* Centered Exchange Rate Indicator */}
      <View className="items-center my-[-10px] z-10">
        <View className="w-8 h-8 rounded-full bg-primary-500 items-center justify-center shadow-md">
          <ArrowDown size={16} color="#FFFFFF" />
        </View>
      </View>

      <View className="bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl p-4 mt-2 mb-4 border border-neutral-100 dark:border-neutral-800">
        <Text className="text-xs text-neutral-500 font-medium">Recipient Receives</Text>
        <Text className="text-2xl font-extrabold text-success-600 dark:text-success-400 mt-1">
          {formatCurrency(receiveAmount, receiveCurrency)}
        </Text>
      </View>

      {/* Detailed Transfer Ledger */}
      <View className="space-y-3 py-2 border-t border-neutral-100 dark:border-neutral-700/60">
        {/* Recipient */}
        <View className="flex-row items-center justify-between py-1">
          <Text className="text-xs text-neutral-500 font-medium">Recipient</Text>
          <Text className="text-xs font-bold text-neutral-900 dark:text-white">
            {recipientName}
          </Text>
        </View>

        {/* Bank & Account */}
        <View className="flex-row items-center justify-between py-1">
          <Text className="text-xs text-neutral-500 font-medium">Bank & Account</Text>
          <Text className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {recipientBank} ({recipientAccount.slice(-4)})
          </Text>
        </View>

        {/* Live Exchange Rate */}
        <View className="flex-row items-center justify-between py-1">
          <Text className="text-xs text-neutral-500 font-medium">Exchange Rate</Text>
          <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
            1 {sendCurrency} = {exchangeRate.toFixed(4)} {receiveCurrency}
          </Text>
        </View>

        {/* Transfer Fee */}
        <View className="flex-row items-center justify-between py-1">
          <Text className="text-xs text-neutral-500 font-medium">Transfer Fee</Text>
          {fee === 0 ? (
            <Badge variant="success" size="xs">
              Zero Fee
            </Badge>
          ) : (
            <Text className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              {formatCurrency(fee, sendCurrency)}
            </Text>
          )}
        </View>

        {/* Delivery Time */}
        <View className="flex-row items-center justify-between py-1">
          <View className="flex-row items-center">
            <Clock size={13} color="#64748B" />
            <Text className="ml-1 text-xs text-neutral-500 font-medium">Delivery Speed</Text>
          </View>
          <Text className="text-xs font-bold text-neutral-900 dark:text-white">
            {estimatedDelivery}
          </Text>
        </View>

        {/* Total Deducted */}
        <View className="flex-row items-center justify-between pt-3 mt-2 border-t border-dashed border-neutral-200 dark:border-neutral-700">
          <Text className="text-sm font-bold text-neutral-900 dark:text-white">
            Total Payment
          </Text>
          <Text className="text-lg font-black text-neutral-900 dark:text-white">
            {formatCurrency(totalDebit, sendCurrency)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      {onConfirm && (
        <View className="mt-5 space-y-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            onPress={onConfirm}
          >
            Authorize & Transfer
          </Button>

          {onCancel && (
            <Button
              variant="ghost"
              size="md"
              fullWidth
              disabled={isLoading}
              onPress={onCancel}
              className="mt-1"
            >
              Cancel
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

export default TransferSummaryCard;
