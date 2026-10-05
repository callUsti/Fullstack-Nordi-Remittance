// ============================================================================
// OTP / TRANSACTION PIN INPUT COMPONENT
// Used for: 2FA, Transaction PIN, and Secure Transfer Code Verification
// ============================================================================

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { cn } from '@utils/cn';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  isPin?: boolean;
  error?: string;
  resendCountdown?: number;
  onResend?: () => void;
  className?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  isPin = false,
  error,
  resendCountdown = 0,
  onResend,
  className,
}) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const handleChangeText = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');

    if (cleanText.length > 1) {
      // Handles pasting full code
      const pasted = cleanText.slice(0, length);
      onChange(pasted);
      const nextIdx = Math.min(pasted.length, length - 1);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanText;
    const combined = newDigits.join('');
    onChange(combined);

    if (cleanText && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View className={cn('items-center w-full my-4', className)}>
      {/* Box Containers */}
      <View className="flex-row items-center justify-center space-x-2 sm:space-x-3 w-full">
        {Array.from({ length }).map((_, index) => {
          const isFocused = focusedIndex === index;
          const hasValue = Boolean(digits[index]);

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={1}
              onPress={() => inputRefs.current[index]?.focus()}
              className={cn(
                'w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 items-center justify-center bg-white dark:bg-neutral-800 shadow-sm mx-1',
                error
                  ? 'border-error-500 bg-error-50/20'
                  : isFocused
                  ? 'border-primary-500 bg-primary-50/30 dark:border-primary-400'
                  : hasValue
                  ? 'border-primary-200 dark:border-primary-900'
                  : 'border-neutral-200 dark:border-neutral-700',
              )}
            >
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                value={digits[index]}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => setFocusedIndex(index)}
                keyboardType="number-pad"
                maxLength={length}
                secureTextEntry={isPin}
                className="w-full h-full text-center text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-white"
                selectTextOnFocus
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Error Message */}
      {error && (
        <Text className="text-xs font-semibold text-error-600 dark:text-error-400 mt-2.5 text-center">
          {error}
        </Text>
      )}

      {/* Resend Option */}
      {onResend && (
        <View className="flex-row items-center mt-5">
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            Didn't receive the code?{' '}
          </Text>
          {resendCountdown > 0 ? (
            <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
              Resend in {resendCountdown}s
            </Text>
          ) : (
            <TouchableOpacity onPress={onResend}>
              <Text className="text-xs font-bold text-primary-600 dark:text-primary-400 underline">
                Resend code
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default OtpInput;
