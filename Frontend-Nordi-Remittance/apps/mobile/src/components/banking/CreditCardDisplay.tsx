// ============================================================================
// CREDIT CARD DISPLAY - Visual debit/credit/virtual card with chip & reveal
// ============================================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Eye, EyeOff, Copy, Snowflake, Lock, Wifi } from 'lucide-react-native';
import { cn } from '@utils/cn';

// ========================
// TYPES
// ========================
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover';
export type CardType = 'debit' | 'credit' | 'virtual';
export type CardStatus = 'active' | 'frozen' | 'expired' | 'blocked';

export interface CreditCardDisplayProps {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv?: string;
  brand?: CardBrand;
  type?: CardType;
  status?: CardStatus;
  variant?: 'blue' | 'dark' | 'gold' | 'purple';
  onPress?: () => void;
  onFreezeToggle?: () => void;
  className?: string;
}

const variantGradients: Record<string, readonly [string, string, string]> = {
  blue: ['#1E3A8A', '#1D4ED8', '#0F172A'],
  dark: ['#1E293B', '#0F172A', '#020617'],
  gold: ['#B45309', '#D97706', '#78350F'],
  purple: ['#581C87', '#7E22CE', '#3B0764'],
};

export const CreditCardDisplay: React.FC<CreditCardDisplayProps> = ({
  cardNumber,
  cardholderName,
  expiryDate,
  cvv = '•••',
  brand = 'visa',
  type = 'virtual',
  status = 'active',
  variant = 'blue',
  onPress,
  onFreezeToggle,
  className,
}) => {
  const [showNumbers, setShowNumbers] = useState(false);
  const [copied, setCopied] = useState(false);

  const isFrozen = status === 'frozen';

  // Format card number as 4 groups
  const cleanNumber = cardNumber.replace(/\s+/g, '');
  const formattedNumber = showNumbers
    ? cleanNumber.replace(/(\d{4})/g, '$1 ').trim()
    : `•••• •••• •••• ${cleanNumber.slice(-4)}`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(cleanNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gradients = variantGradients[variant] || variantGradients.blue;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      className={cn(
        'w-full aspect-[1.586] rounded-3xl overflow-hidden shadow-xl shadow-black/25 relative mb-4',
        className,
      )}
    >
      <LinearGradient
        colors={gradients}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 p-5 justify-between"
      >
        {/* Top Row: Bank Brand + Type & NFC */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white font-extrabold text-lg tracking-wider">
              NORDI
            </Text>
            <Text className="text-white/60 text-[10px] uppercase font-bold tracking-widest">
              {type} Card
            </Text>
          </View>

          <View className="flex-row items-center space-x-2">
            <View style={{ transform: [{ rotate: '90deg' }] }} className="mr-1">
              <Wifi size={20} color="#FFFFFF" opacity={0.7} />
            </View>
            {isFrozen && (
              <View className="flex-row items-center bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-400/40">
                <Snowflake size={12} color="#38BDF8" className="mr-1" />
                <Text className="text-sky-300 text-[10px] font-bold uppercase">
                  Frozen
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Chip & Action Bar */}
        <View className="flex-row items-center justify-between my-1">
          {/* EMV Chip */}
          <View className="w-11 h-8 rounded-lg bg-amber-200/90 border border-amber-400/60 overflow-hidden justify-center px-1 shadow-inner">
            <View className="w-full h-[1px] bg-amber-700/30 my-0.5" />
            <View className="w-full h-[1px] bg-amber-700/30 my-0.5" />
          </View>

          {/* Quick Actions */}
          <View className="flex-row items-center space-x-1">
            <TouchableOpacity
              onPress={() => setShowNumbers(!showNumbers)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="p-2 rounded-full bg-white/10 active:bg-white/20 mr-1"
            >
              {showNumbers ? (
                <EyeOff size={16} color="#FFFFFF" />
              ) : (
                <Eye size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCopy}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="p-2 rounded-full bg-white/10 active:bg-white/20"
            >
              <Copy size={16} color={copied ? '#10B981' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Number */}
        <View className="my-1">
          <Text className="text-white font-mono text-xl sm:text-2xl font-bold tracking-widest">
            {formattedNumber}
          </Text>
        </View>

        {/* Bottom Row: Cardholder + Expiry + Brand Logo */}
        <View className="flex-row items-end justify-between pt-1">
          <View className="flex-1 mr-2">
            <Text className="text-white/60 text-[9px] uppercase font-bold tracking-wider">
              Cardholder
            </Text>
            <Text
              numberOfLines={1}
              className="text-white font-bold text-xs uppercase tracking-wider"
            >
              {cardholderName}
            </Text>
          </View>

          <View className="mr-4">
            <Text className="text-white/60 text-[9px] uppercase font-bold tracking-wider">
              Expires
            </Text>
            <Text className="text-white font-mono font-bold text-xs">
              {expiryDate}
            </Text>
          </View>

          <View className="mr-4">
            <Text className="text-white/60 text-[9px] uppercase font-bold tracking-wider">
              CVV
            </Text>
            <Text className="text-white font-mono font-bold text-xs">
              {showNumbers ? cvv : '•••'}
            </Text>
          </View>

          {/* Brand Logo Display */}
          <View className="items-center justify-center">
            {brand === 'mastercard' ? (
              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-red-500/90 -mr-2" />
                <View className="w-6 h-6 rounded-full bg-amber-400/90" />
              </View>
            ) : (
              <Text className="text-white font-black italic text-lg tracking-tighter">
                VISA
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default CreditCardDisplay;
