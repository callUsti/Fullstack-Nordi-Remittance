// ============================================================================
// LOGIN SCREEN — Nordea Internet Banking (Mobile)
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, ShieldAlert, Globe, ExternalLink } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

// Reusable Components
import AuthLayout from '@/components/auth_components/AuthLayout';
import { Button, Input } from '@/components/ui';

// Shared hooks & stores
import { useLogin } from '@nordi/shared/hooks/api-queries/useAuth';
import { useAuthStore } from '@nordi/shared/store/auth.store';
import { useClerkSocialAuth } from '@/core/auth/clerk';

// Website base URL for external registration
const WEB_SIGNUP_URL =
  process.env.EXPO_PUBLIC_WEB_SIGNUP_URL ||
  'https://nordi-remittance.web.app/auth/signup';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuthenticated } = useAuthStore();
  const loginMutation = useLogin();
  const { signInWithGoogle, isLoading: isSocialLoading, isClerkAvailable } = useClerkSocialAuth();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setErrorMessage(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }

    return valid;
  };

  // Direct Credentials Sign In
  const handleLogin = async () => {
    if (!validate()) return;
    setErrorMessage(null);

    try {
      const response = await loginMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        password,
      });
      // 1. Check for Step-Up 2FA / OTP requirement
      const res = response as any;
      if (res.requiresTwoFactor || res.requires2FA || res.requiresOtp) {
        router.push({
          pathname: '/(auth)/otp',
          params: {
            otpSessionToken: res.tempToken || res.otpSessionToken || '',
            email: email.trim().toLowerCase(),
            isAdmin: 'false',
          },
        });
        return;
      }

      // 2. Auth Store setup
      if (res.user) {
        const u = res.user as any;
        setAuthenticated({
          id: u.id || u._id || '',
          email: u.email,
          firstName: u.firstName || 'User',
          lastName: u.lastName || '',
          avatar: u.avatar || u.profilePicture,
          role: u.role || 'user',
          kycStatus: u.kycStatus || 'pending',
          isEmailVerified: u.emailVerified ?? u.isEmailVerified ?? true,
          isPhoneVerified: u.phoneVerified ?? u.isPhoneVerified ?? false,
        });
      }

      // 3. Navigate to Dashboard
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Authentication failed. Please verify your credentials.';
      setErrorMessage(msg);
    }
  };

  // Google Social Sign In via Clerk
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    try {
      await signInWithGoogle(router);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google sign-in could not be completed.');
    }
  };

  // External Web Registration Handler
  const handleOpenWebSignup = async () => {
    try {
      await WebBrowser.openBrowserAsync(WEB_SIGNUP_URL);
    } catch {
      await Linking.openURL(WEB_SIGNUP_URL);
    }
  };

  const isPending = loginMutation.isPending || isSocialLoading;

  return (
    <AuthLayout
      title="Welcome to Nordea"
      subtitle="Sign in with your Internet Banking credentials"
      variant="login"
      showBackButton={false}
      alternateAction={{
        text: 'New customer?',
        linkText: 'Open an account',
        onPress: handleOpenWebSignup,
      }}
    >
      <View className="space-y-4">
        {/* Error Alert */}
        {(errorMessage || loginMutation.error) && (
          <View className="flex-row items-center gap-2.5 p-3.5 rounded-xl bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800">
            <ShieldAlert size={18} color="#EF4444" />
            <Text className="flex-1 text-xs font-medium text-error-700 dark:text-error-300">
              {errorMessage || loginMutation.error?.message || 'Sign in error'}
            </Text>
          </View>
        )}

        {/* Email Input */}
        <Input
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<Mail size={18} color="#6B7280" />}
          error={emailError}
        />

        {/* Password Input */}
        <Input
          label="Password"
          placeholder="Enter your account password"
          value={password}
          onChangeText={setPassword}
          isPassword
          leftIcon={<Lock size={18} color="#6B7280" />}
          error={passwordError}
        />

        {/* Forgot Password Link */}
        <View className="items-end pt-1">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            accessibilityLabel="Forgot Password"
          >
            <Text className="text-xs font-semibold text-primary-600 dark:text-primary-400">
              Forgot Username or Password?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <View className="pt-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isPending}
            isDisabled={isPending}
            onPress={handleLogin}
          >
            Sign In
          </Button>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-4">
          <View className="flex-1 h-[1px] bg-neutral-200 dark:bg-neutral-800" />
          <Text className="px-3 text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            or continue with
          </Text>
          <View className="flex-1 h-[1px] bg-neutral-200 dark:bg-neutral-800" />
        </View>

        {/* Google OAuth Button */}
        <Button
          variant="outline"
          size="lg"
          fullWidth
          isDisabled={isPending}
          onPress={handleGoogleSignIn}
          leftIcon={
            <Globe size={18} color="#2563EB" />
          }
        >
          Continue with Google
        </Button>

        {/* Register On Web (App is for existing users only) */}
        <View className="mt-4 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              New to Nordea Remittance?
            </Text>
            <ExternalLink size={14} color="#6B7280" />
          </View>
          <Text className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
            Mobile app access requires an existing verified banking account. Please complete KYC registration on our secure web platform.
          </Text>
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onPress={handleOpenWebSignup}
            className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
          >
            Register on Web Platform
          </Button>
        </View>
      </View>
    </AuthLayout>
  );
}
