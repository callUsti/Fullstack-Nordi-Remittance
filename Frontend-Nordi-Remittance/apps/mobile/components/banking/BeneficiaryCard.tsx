// ============================================================================
// BENEFICIARY CARD - Saved recipient card with quick remittance send action
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Star, Send, Building, Trash2 } from 'lucide-react-native';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { cn } from '@utils/cn';

export interface Beneficiary {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  currency: string;
  avatarUrl?: string;
  isFavorite?: boolean;
  countryCode?: string;
}

export interface BeneficiaryCardProps {
  beneficiary: Beneficiary;
  onSendMoney?: (beneficiary: Beneficiary) => void;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPress?: () => void;
  className?: string;
}

export const BeneficiaryCard: React.FC<BeneficiaryCardProps> = ({
  beneficiary,
  onSendMoney,
  onToggleFavorite,
  onDelete,
  onPress,
  className,
}) => {
  const { id, name, bankName, accountNumber, currency, avatarUrl, isFavorite } =
    beneficiary;

  const maskedAccount =
    accountNumber.length > 4
      ? `•••• ${accountNumber.slice(-4)}`
      : accountNumber;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress || (() => onSendMoney && onSendMoney(beneficiary))}
      className={cn(
        'flex-row items-center justify-between p-4 my-1.5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/60 shadow-sm shadow-neutral-900/5',
        className,
      )}
    >
      {/* Left Avatar & Name */}
      <View className="flex-row items-center flex-1 mr-3">
        <Avatar src={avatarUrl} name={name} size="md" className="mr-3" />

        <View className="flex-1">
          <View className="flex-row items-center">
            <Text
              numberOfLines={1}
              className="text-sm font-bold text-neutral-900 dark:text-white mr-1.5"
            >
              {name}
            </Text>
            {onToggleFavorite && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(id);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Star
                  size={14}
                  color={isFavorite ? '#F59E0B' : '#94A3B8'}
                  fill={isFavorite ? '#F59E0B' : 'transparent'}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text
            numberOfLines={1}
            className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5"
          >
            {bankName} • {maskedAccount}
          </Text>
        </View>
      </View>

      {/* Right Currency & Quick Send Button */}
      <View className="flex-row items-center space-x-2">
        <Badge variant="primary" size="xs" className="mr-2">
          {currency}
        </Badge>

        {onSendMoney && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onSendMoney(beneficiary);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            className="w-9 h-9 rounded-xl bg-primary-500 items-center justify-center active:bg-primary-600 shadow-sm shadow-primary-500/20"
          >
            <Send size={15} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {onDelete && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="p-2 ml-1"
          >
            <Trash2 size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default BeneficiaryCard;
