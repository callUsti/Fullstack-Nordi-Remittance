// ============================================================================
// FORGOT PASSWORD SCREEN — Nordea Mobile Banking
// ============================================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, CheckCircle2, ArrowLeft, ShieldAlert } from 'lucide-react-native';

// Reusable Components
import AuthLayout from '@/components/auth_components/AuthLayout';
import { Button, Input } from '@/components/ui';

// Shared hooks
import { useForgotPassword } from '@nordi/shared/hooks/api-queries/useAuth';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const forgotPasswordMutation = useForgotPassword();

  const handleSendLink = async () => {
    setEmailError('');
    setErrorMessage(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync({ email: emailTrimmed.toLowerCase() });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send password reset link. Please check the email address.'
      );
    }
  };

  // SUCCESS STATE
  if (isSuccess) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="Password reset instructions sent"
        variant="login"
        showBackButton={false}
      >
        <View className="items-center py-6 px-2">
          <View className="w-20 h-20 rounded-full bg-success-100 dark:bg-success-950/60 items-center justify-center mb-6">
            <CheckCircle2 size={42} color={theme.isDark ? '#86efac' : '#10B981'} />
          </View>

          <Text className="text-sm text-neutral-600 dark:text-neutral-300 text-center leading-relaxed mb-8">
            If an account is associated with <Text className="font-semibold text-neutral-900 dark:text-white">{email}</Text>, you will receive a secure password reset link.
          </Text>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          >
            Back to Sign In
          </Button>
        </View>
      </AuthLayout>
    );
  }

  // FORM STATE
  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive recovery instructions"
      variant="login"
      showBackButton={true}
    >
      <View className="space-y-4">
        {/* Error Alert */}
        {(errorMessage || forgotPasswordMutation.error) && (
          <View className="flex-row items-center gap-2.5 p-3.5 rounded-xl bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800">
            <ShieldAlert size={18} color={theme.danger} />
            <Text className="flex-1 text-xs font-medium text-error-700 dark:text-error-300">
              {errorMessage || forgotPasswordMutation.error?.message || 'Error occurred'}
            </Text>
          </View>
        )}

        <Input
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<Mail size={18} color={theme.iconMuted} />}
          error={emailError}
          helperText="We will send a password reset verification link to this address."
        />

        <View className="pt-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={forgotPasswordMutation.isPending}
            isDisabled={forgotPasswordMutation.isPending}
            onPress={handleSendLink}
          >
            Send Reset Instructions
          </Button>
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          className="flex-row items-center justify-center gap-2 py-3"
        >
          <ArrowLeft size={16} color="#6B7280" />
          <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            Return to Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}
