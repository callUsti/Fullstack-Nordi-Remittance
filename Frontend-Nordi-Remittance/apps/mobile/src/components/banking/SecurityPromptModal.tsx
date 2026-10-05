// ============================================================================
// SECURITY PROMPT MODAL - Biometric & Transaction PIN authorization sheet
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield, Delete, X, ScanFace } from 'lucide-react-native';
import { cn } from '@utils/cn';

export interface SecurityPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pinOrToken: string) => void;
  title?: string;
  subtitle?: string;
  actionAmount?: string;
  enableBiometrics?: boolean;
}

export const SecurityPromptModal: React.FC<SecurityPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Authorize Transaction',
  subtitle = 'Enter your 4-digit Transaction PIN to confirm',
  actionAmount,
  enableBiometrics = true,
}) => {
  const [pin, setPin] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      checkBiometricAvailability();
    }
  }, [isOpen]);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(compatible && enrolled);

      if (enableBiometrics && compatible && enrolled) {
        triggerBiometrics();
      }
    } catch {
      setHasBiometrics(false);
    }
  };

  const triggerBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authorize Transfer with Biometrics',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        onSuccess('biometric_verified_token');
      }
    } catch {
      // User can proceed with PIN
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const updated = pin + num;
      setPin(updated);
      if (updated.length === 4) {
        setTimeout(() => {
          onSuccess(updated);
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black/60 justify-end">
        <View className="bg-white dark:bg-neutral-800 rounded-t-3xl p-6 pb-8 items-center shadow-2xl">
          {/* Top Close Button */}
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="self-end p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700"
          >
            <X size={18} color="#64748B" />
          </TouchableOpacity>

          {/* Shield Icon */}
          <View className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/40 items-center justify-center mb-3">
            <Shield size={28} color="#1E3A8A" />
          </View>

          {/* Title & Subtitle */}
          <Text className="text-xl font-bold text-neutral-900 dark:text-white text-center">
            {title}
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-center max-w-xs">
            {subtitle}
          </Text>

          {/* Action Amount */}
          {actionAmount && (
            <View className="my-3 py-1.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-700/60">
              <Text className="text-lg font-extrabold text-neutral-900 dark:text-white">
                {actionAmount}
              </Text>
            </View>
          )}

          {/* 4 PIN Dots */}
          <View className="flex-row items-center justify-center space-x-4 my-6">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <View
                  key={index}
                  className={cn(
                    'w-4 h-4 rounded-full border-2 mx-2',
                    isFilled
                      ? 'bg-primary-600 border-primary-600 dark:bg-primary-400 dark:border-primary-400 scale-110'
                      : 'border-neutral-300 dark:border-neutral-600 bg-transparent',
                  )}
                />
              );
            })}
          </View>

          {/* Numeric Keypad */}
          <View className="w-full max-w-xs">
            <View className="flex-row justify-between mb-3">
              {['1', '2', '3'].map((n) => (
                <KeypadButton key={n} num={n} onPress={() => handleKeyPress(n)} />
              ))}
            </View>
            <View className="flex-row justify-between mb-3">
              {['4', '5', '6'].map((n) => (
                <KeypadButton key={n} num={n} onPress={() => handleKeyPress(n)} />
              ))}
            </View>
            <View className="flex-row justify-between mb-3">
              {['7', '8', '9'].map((n) => (
                <KeypadButton key={n} num={n} onPress={() => handleKeyPress(n)} />
              ))}
            </View>
            <View className="flex-row justify-between items-center">
              {/* Biometrics button or empty */}
              {hasBiometrics ? (
                <TouchableOpacity
                  onPress={triggerBiometrics}
                  className="w-20 h-14 rounded-2xl items-center justify-center active:bg-primary-50"
                >
                  <ScanFace size={26} color="#1E3A8A" />
                </TouchableOpacity>
              ) : (
                <View className="w-20 h-14" />
              )}

              <KeypadButton num="0" onPress={() => handleKeyPress('0')} />

              <TouchableOpacity
                onPress={handleDelete}
                className="w-20 h-14 rounded-2xl items-center justify-center active:bg-neutral-100"
              >
                <Delete size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const KeypadButton = ({ num, onPress }: { num: string; onPress: () => void }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    className="w-20 h-14 rounded-2xl bg-neutral-100/80 dark:bg-neutral-700/60 items-center justify-center active:bg-primary-100"
  >
    <Text className="text-xl font-bold text-neutral-900 dark:text-white">
      {num}
    </Text>
  </TouchableOpacity>
);

export default SecurityPromptModal;
