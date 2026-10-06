// ============================================================================
// FX RATE CONVERTER - Currency exchange converter widget with live rate calculation
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { ArrowUpDown, RefreshCw, TrendingUp } from 'lucide-react-native';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { cn } from '@utils/cn';

export interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
}

export interface FxRateConverterProps {
  initialSendAmount?: number;
  initialFromCurrency?: string;
  initialToCurrency?: string;
  exchangeRate: number; // e.g. 1.25 (1 from = 1.25 to)
  fee?: number;
  currencies?: CurrencyItem[];
  onConvert?: (sendAmount: number, from: string, to: string) => void;
  onContinue?: (data: {
    sendAmount: number;
    receiveAmount: number;
    from: string;
    to: string;
    rate: number;
  }) => void;
  className?: string;
}

const DEFAULT_CURRENCIES: CurrencyItem[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
];

export const FxRateConverter: React.FC<FxRateConverterProps> = ({
  initialSendAmount = 1000,
  initialFromCurrency = 'USD',
  initialToCurrency = 'NGN',
  exchangeRate,
  fee = 0,
  currencies = DEFAULT_CURRENCIES,
  onConvert,
  onContinue,
  className,
}) => {
  const [sendAmount, setSendAmount] = useState<string>(String(initialSendAmount));
  const [fromCurrency, setFromCurrency] = useState<string>(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState<string>(initialToCurrency);

  const numericSend = parseFloat(sendAmount) || 0;
  const receiveAmount = numericSend * exchangeRate;

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleAmountChange = (text: string) => {
    // Only allow numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    setSendAmount(cleaned);
    if (onConvert) {
      onConvert(parseFloat(cleaned) || 0, fromCurrency, toCurrency);
    }
  };

  const fromCurrObj = currencies.find((c) => c.code === fromCurrency);
  const toCurrObj = currencies.find((c) => c.code === toCurrency);

  return (
    <View
      className={cn(
        'w-full bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-neutral-100 dark:border-neutral-700 shadow-xl shadow-neutral-900/5',
        className,
      )}
    >
      {/* Top Live Rate Bar */}
      <View className="flex-row items-center justify-between pb-3.5 mb-3 border-b border-neutral-100 dark:border-neutral-700/60">
        <View className="flex-row items-center">
          <TrendingUp size={16} color="#10B981" />
          <Text className="ml-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
            1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
          </Text>
        </View>

        {fee === 0 ? (
          <Badge variant="success" size="xs">
            Zero Fee Transfer
          </Badge>
        ) : (
          <Badge variant="default" size="xs">
            Fee: ${fee.toFixed(2)}
          </Badge>
        )}
      </View>

      {/* Sending Box */}
      <View className="bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700/60">
        <Text className="text-xs text-neutral-500 font-medium mb-1">
          You send exactly
        </Text>
        <View className="flex-row items-center justify-between">
          <TextInput
            value={sendAmount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            className="flex-1 text-2xl font-black text-neutral-900 dark:text-white py-0 mr-3"
          />

          {/* Currency Pill */}
          <View className="flex-row items-center bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <Text className="text-base mr-1.5">{fromCurrObj?.flag || '🌐'}</Text>
            <Text className="text-sm font-bold text-neutral-900 dark:text-white">
              {fromCurrency}
            </Text>
          </View>
        </View>
      </View>

      {/* Swap Button Divider */}
      <View className="items-center my-[-12px] z-10">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSwap}
          className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center shadow-md active:scale-95"
        >
          <ArrowUpDown size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Receiving Box */}
      <View className="bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700/60 mt-1 mb-4">
        <Text className="text-xs text-neutral-500 font-medium mb-1">
          Recipient receives
        </Text>
        <View className="flex-row items-center justify-between">
          <Text
            numberOfLines={1}
            className="flex-1 text-2xl font-black text-success-600 dark:text-success-400 mr-3 font-mono"
          >
            {new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(receiveAmount)}
          </Text>

          {/* Currency Pill */}
          <View className="flex-row items-center bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <Text className="text-base mr-1.5">{toCurrObj?.flag || '🌐'}</Text>
            <Text className="text-sm font-bold text-neutral-900 dark:text-white">
              {toCurrency}
            </Text>
          </View>
        </View>
      </View>

      {/* Action CTA */}
      {onContinue && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() =>
            onContinue({
              sendAmount: numericSend,
              receiveAmount,
              from: fromCurrency,
              to: toCurrency,
              rate: exchangeRate,
            })
          }
        >
          Continue Transfer
        </Button>
      )}
    </View>
  );
};

export default FxRateConverter;
