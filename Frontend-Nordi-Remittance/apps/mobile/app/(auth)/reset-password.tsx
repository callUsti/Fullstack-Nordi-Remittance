// ============================================================================
// RESET PASSWORD SCREEN — Nordea Mobile Banking
// ============================================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock, KeyRound, CheckCircle2, ShieldAlert, Check, X } from 'lucide-react-native';

// Reusable Components
import AuthLayout from '@/components/auth_components/AuthLayout';
import { Button, Input } from '@/components/ui';

// Shared hooks
import { useResetPassword } from '@nordi/shared/hooks/api-queries/useAuth';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const params = useLocalSearchParams<{ token?: string }>();
  const initialToken = params.token || '';

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetPasswordMutation = useResetPassword();

  // Password rules validation
  const rules = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleResetPassword = async () => {
    setPasswordError('');
    setConfirmError('');
    setErrorMessage(null);

    const activeToken = token.trim();
    if (!activeToken) {
      setErrorMessage('Reset token is missing or expired. Please request a new link.');
      return;
    }

    if (!isPasswordValid) {
      setPasswordError('Please meet all password complexity requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        token: activeToken,
        password,
        confirmPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to reset password. The token may be expired or invalid.'
      );
    }
  };

  // SUCCESS STATE
  if (isSuccess) {
    return (
      <AuthLayout
        title="Password Reset"
        subtitle="Your password has been changed"
        variant="login"
        showBackButton={false}
      >
        <View className="items-center py-6 px-2">
          <View className="w-20 h-20 rounded-full bg-success-100 dark:bg-success-950/60 items-center justify-center mb-6">
            <CheckCircle2 size={42} color={theme.isDark ? '#86efac' : '#10B981'} />
          </View>

          <Text className="text-sm text-neutral-600 dark:text-neutral-300 text-center leading-relaxed mb-8">
            Your new password has been saved securely. You can now use your updated credentials to access Nordea Internet Banking.
          </Text>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          >
            Proceed to Sign In
          </Button>
        </View>
      </AuthLayout>
    );
  }

  // FORM STATE
  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Enter a strong, secure password for your account"
      variant="login"
      showBackButton={true}
    >
      <View className="space-y-4">
        {/* Error Alert */}
        {(errorMessage || resetPasswordMutation.error) && (
          <View className="flex-row items-center gap-2.5 p-3.5 rounded-xl bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800">
            <ShieldAlert size={18} color={theme.danger} />
            <Text className="flex-1 text-xs font-medium text-error-700 dark:text-error-300">
              {errorMessage || resetPasswordMutation.error?.message || 'Error occurred'}
            </Text>
          </View>
        )}

        {/* Token input if not provided via deep link */}
        {!initialToken && (
          <Input
            label="Verification Code / Token"
            placeholder="Paste reset token from email"
            value={token}
            onChangeText={setToken}
            leftIcon={<KeyRound size={18} color={theme.iconMuted} />}
          />
        )}

        {/* New Password */}
        <Input
          label="New Password"
          placeholder="Enter new password"
          value={password}
          onChangeText={setPassword}
          isPassword
          leftIcon={<Lock size={18} color="#6B7280" />}
          error={passwordError}
        />

        {/* Confirm Password */}
        <Input
          label="Confirm New Password"
          placeholder="Repeat new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          leftIcon={<Lock size={18} color="#6B7280" />}
          error={confirmError}
        />

        {/* Password Strength Checklist */}
        <View className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
          <Text className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
            Password requirements:
          </Text>
          {[
            { label: 'At least 8 characters', met: rules.length },
            { label: 'One uppercase letter (A-Z)', met: rules.uppercase },
            { label: 'One lowercase letter (a-z)', met: rules.lowercase },
            { label: 'One number (0-9)', met: rules.number },
            { label: 'One special symbol (!@#$%...)', met: rules.special },
          ].map((item, i) => (
            <View key={i} className="flex-row items-center gap-2">
              {item.met ? (
                <Check size={14} color="#10B981" />
              ) : (
                <X size={14} color="#9CA3AF" />
              )}
              <Text
                className={`text-[11px] ${
                  item.met
                    ? 'text-success-600 dark:text-success-400 font-medium'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View className="pt-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={resetPasswordMutation.isPending}
            isDisabled={resetPasswordMutation.isPending || !token}
            onPress={handleResetPassword}
          >
            Update Password
          </Button>
        </View>
      </View>
    </AuthLayout>
  );
}
