// ============================================================================
// VERIFY EMAIL SCREEN — Nordea Mobile Banking
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Mail, CheckCircle2, XCircle, RefreshCw, ArrowLeft } from 'lucide-react-native';

// Reusable Components
import AuthLayout from '@/components/auth_components/AuthLayout';
import { Button, Spinner } from '@/components/ui';

// Shared hooks & store
import { useVerifyEmail, useResendVerificationEmail } from '@nordi/shared/hooks/api-queries/useAuth';
import { useAuthStore } from '@nordi/shared/store/auth.store';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token;

  const { user } = useAuthStore();
  const verifyEmailMutation = useVerifyEmail();
  const resendEmailMutation = useResendVerificationEmail();

  const [hasAttempted, setHasAttempted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-verify if token is provided via deep link
  useEffect(() => {
    if (token && !hasAttempted) {
      setHasAttempted(true);
      verifyEmailMutation.mutate(token);
    }
  }, [token, hasAttempted]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendEmailMutation.mutateAsync();
      setResendCooldown(60);
    } catch {
      // Handled by mutation onError toast
    }
  };

  // 1. AUTO-TOKEN VERIFYING STATE
  if (token) {
    const isVerifying = verifyEmailMutation.isPending;
    const isSuccess = verifyEmailMutation.isSuccess;
    const isError = verifyEmailMutation.isError;

    return (
      <AuthLayout
        title="Email Verification"
        subtitle={isVerifying ? 'Validating your security token...' : 'Verification status'}
        variant="verify"
        showBackButton={false}
      >
        <View className="items-center py-6 px-2">
          {isVerifying && (
            <View className="items-center py-8 space-y-4">
              <Spinner size="lg" variant="primary" />
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                Confirming email address...
              </Text>
            </View>
          )}

          {isSuccess && (
            <>
              <View className="w-20 h-20 rounded-full bg-success-100 dark:bg-success-950/60 items-center justify-center mb-6">
                <CheckCircle2 size={42} color="#10B981" />
              </View>
              <Text className="text-base font-semibold text-neutral-900 dark:text-white text-center mb-2">
                Email Successfully Verified!
              </Text>
              <Text className="text-sm text-neutral-600 dark:text-neutral-300 text-center leading-relaxed mb-8">
                Your account is now fully verified. You have full access to Nordea transfers and features.
              </Text>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => router.replace('/(tabs)')}
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {isError && (
            <>
              <View className="w-20 h-20 rounded-full bg-error-100 dark:bg-error-950/60 items-center justify-center mb-6">
                <XCircle size={42} color="#EF4444" />
              </View>
              <Text className="text-base font-semibold text-neutral-900 dark:text-white text-center mb-2">
                Verification Failed
              </Text>
              <Text className="text-sm text-neutral-600 dark:text-neutral-300 text-center leading-relaxed mb-8">
                {verifyEmailMutation.error?.message ||
                  'The verification link is invalid or has expired. Please request a new link.'}
              </Text>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => router.replace('/(auth)/login')}
              >
                Return to Sign In
              </Button>
            </>
          )}
        </View>
      </AuthLayout>
    );
  }

  // 2. NOTICE / RESEND STATE (User is logged in but email is not verified yet)
  const userEmail = user?.email || 'your registered email';

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="Complete account verification to enable transactions"
      variant="verify"
      showBackButton={true}
    >
      <View className="items-center py-4 px-2 space-y-4">
        <View className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-950/60 items-center justify-center mb-2">
          <Mail size={38} color="#2563EB" />
        </View>

        <Text className="text-sm text-neutral-600 dark:text-neutral-300 text-center leading-relaxed">
          We have sent a verification email to:
        </Text>
        <Text className="text-base font-bold text-neutral-900 dark:text-white text-center">
          {userEmail}
        </Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400 text-center leading-relaxed px-4">
          Please click the confirmation link in the email to activate your account. If you cannot find the message, check your spam or junk folder.
        </Text>

        <View className="w-full pt-4 space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={resendEmailMutation.isPending}
            isDisabled={resendCooldown > 0 || resendEmailMutation.isPending}
            onPress={handleResend}
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend Verification Email'}
          </Button>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(tabs)')}
          >
            Continue to Dashboard
          </Button>

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
      </View>
    </AuthLayout>
  );
}
