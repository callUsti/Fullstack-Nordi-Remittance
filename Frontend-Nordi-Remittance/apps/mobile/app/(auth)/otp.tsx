// ============================================================================
// OTP / 2FA VERIFICATION SCREEN — Nordea Mobile Banking
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck, RotateCw, ShieldAlert, ArrowLeft } from 'lucide-react-native';

// Reusable Components
import AuthLayout from '@/components/auth_components/AuthLayout';
import { Button } from '@/components/ui';

// Shared hooks & store
import {
  useVerifyClerkOtp,
  useResendClerkOtp,
  useVerifyTwoFactor,
  useResendTwoFactorCode,
} from '@nordi/shared/hooks/api-queries/useAuth';
import { useAuthStore } from '@nordi/shared/store/auth.store';
import { processAuthSyncResponse } from '@/core/auth/clerkSync.helper';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
// Backend valid char pattern (omits ambiguous 0/O/1/I)
const VALID_CHARS = /^[A-HJ-NP-Za-hj-np-z2-9]$/;

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    otpSessionToken?: string;
    email?: string;
    isAdmin?: string;
  }>();

  const otpSessionToken = params.otpSessionToken || '';
  const email = params.email || '';
  const isAdmin = params.isAdmin === 'true';

  const { setAuthenticated } = useAuthStore();
  const verifyClerkOtpMutation = useVerifyClerkOtp();
  const resendClerkOtpMutation = useResendClerkOtp();
  const verifyTwoFactorMutation = useVerifyTwoFactor();
  const resendTwoFactorMutation = useResendTwoFactorCode();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 400);
  }, []);

  // Submit OTP Verification
  const handleSubmitOtp = useCallback(
    async (code: string) => {
      setErrorMessage(null);
      Keyboard.dismiss();

      try {
        // Try Clerk OTP verification first
        const response = await verifyClerkOtpMutation.mutateAsync({
          otpSessionToken,
          code: code.toUpperCase(),
          isAdmin,
        });

        processAuthSyncResponse(response, router, setAuthenticated, email);
      } catch (clerkErr: any) {
        // If Clerk fails, try fallback standard 2FA
        try {
          const twoFaRes = await verifyTwoFactorMutation.mutateAsync({
            tempToken: otpSessionToken,
            code: code.toUpperCase(),
          });
          if (twoFaRes.user) {
            const u = twoFaRes.user as any;
            setAuthenticated({
              id: u.id || u._id || '',
              email: u.email,
              firstName: u.firstName || 'User',
              lastName: u.lastName || '',
              avatar: u.avatar,
              role: u.role || 'user',
              kycStatus: u.kycStatus || 'pending',
              isEmailVerified: u.emailVerified ?? u.isEmailVerified ?? true,
              isPhoneVerified: u.phoneVerified ?? u.isPhoneVerified ?? false,
            });
            router.replace('/(tabs)');
            return;
          }
        } catch {
          // Keep original error
        }

        const msg =
          clerkErr?.response?.data?.message ||
          clerkErr?.message ||
          'Verification failed. The code is incorrect or expired.';
        setErrorMessage(msg);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    },
    [otpSessionToken, isAdmin, email, verifyClerkOtpMutation, verifyTwoFactorMutation, router, setAuthenticated]
  );

  const handleCharChange = (index: number, val: string) => {
    // If pasting a full 6-digit code
    if (val.length >= OTP_LENGTH) {
      const sanitized = val
        .toUpperCase()
        .replace(/[^A-HJ-NP-Z2-9]/g, '')
        .slice(0, OTP_LENGTH);

      if (sanitized.length === OTP_LENGTH) {
        const next = sanitized.split('');
        setOtp(next);
        inputRefs.current[OTP_LENGTH - 1]?.focus();
        handleSubmitOtp(sanitized);
        return;
      }
    }

    const char = val.slice(-1);
    if (char && !VALID_CHARS.test(char)) return;

    const next = [...otp];
    next[index] = char.toUpperCase();
    setOtp(next);

    // Auto-advance
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when complete
    const fullCode = next.join('');
    if (fullCode.length === OTP_LENGTH && next.every(Boolean)) {
      handleSubmitOtp(fullCode);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...otp];
        next[index - 1] = '';
        setOtp(next);
      }
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMessage(null);

    try {
      if (otpSessionToken) {
        await resendClerkOtpMutation.mutateAsync(otpSessionToken);
      } else {
        await resendTwoFactorMutation.mutateAsync(otpSessionToken);
      }
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend code. Please try again later.');
    }
  };

  const isPending =
    verifyClerkOtpMutation.isPending ||
    verifyTwoFactorMutation.isPending ||
    resendClerkOtpMutation.isPending;

  // Mask email for display: a***@nordea.com
  const maskedEmail = email
    ? email.replace(/^(.)(.*)(@.*)$/, (_, f, m, l) => `${f}${'*'.repeat(Math.max(m.length, 3))}${l}`)
    : 'your registered email';

  return (
    <AuthLayout
      title="Two-Factor Security"
      subtitle={`Enter the 6-character code sent to ${maskedEmail}`}
      variant="verify"
      showBackButton={true}
    >
      <View className="space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <View className="flex-row items-center gap-2.5 p-3.5 rounded-xl bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800">
            <ShieldAlert size={18} color="#EF4444" />
            <Text className="flex-1 text-xs font-medium text-error-700 dark:text-error-300">
              {errorMessage}
            </Text>
          </View>
        )}

        {/* 6-Digit OTP Inputs */}
        <View className="flex-row justify-between items-center my-2">
          {otp.map((digit, index) => {
            const isFilled = Boolean(digit);
            return (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                value={digit}
                onChangeText={(val) => handleCharChange(index, val)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="ascii-capable"
                autoCapitalize="characters"
                maxLength={OTP_LENGTH} // allows paste
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 ${
                  isFilled
                    ? 'border-primary-600 bg-primary-50/50 dark:border-primary-500 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                    : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white'
                }`}
              />
            );
          })}
        </View>

        {/* Verify Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isPending}
          isDisabled={isPending || otp.some((d) => !d)}
          onPress={() => handleSubmitOtp(otp.join(''))}
        >
          Verify & Continue
        </Button>

        {/* Resend Cooldown Counter */}
        <View className="items-center py-2">
          {cooldown > 0 ? (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              Resend code in <Text className="font-semibold text-primary-600 dark:text-primary-400">{cooldown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResend}
              disabled={isPending}
              className="flex-row items-center gap-1.5"
            >
              <RotateCw size={14} color="#2563EB" />
              <Text className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                Resend verification code
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Return to Sign In */}
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          className="flex-row items-center justify-center gap-2 py-2"
        >
          <ArrowLeft size={16} color="#6B7280" />
          <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}
