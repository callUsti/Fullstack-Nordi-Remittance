// ============================================================================
// LOGIN SCREEN — Nordea Internet Banking (Mobile)
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Globe, ExternalLink } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

// Reusable Components
import AuthLayout from '@/components/auth_components/AuthLayout';
import { Button, Input } from '@/components/ui';

// Shared hooks & stores
import { useLogin } from '@nordi/shared/hooks/api-queries/useAuth';
import { useAuthStore } from '@nordi/shared/store/auth.store';
import { useToast } from '@nordi/shared/store/toast.store';
import { TokenManager } from '@nordi/shared/core/api/client';
import { useClerkSocialAuth } from '@/core/auth/clerk';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

// Website base URL for external registration
const WEB_SIGNUP_URL =
  process.env.EXPO_PUBLIC_WEB_SIGNUP_URL ||
  'https://nordi-remittance.web.app/auth/signup';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const toast = useToast();
  const { isAuthenticated, user, setAuthenticated } = useAuthStore();
  const loginMutation = useLogin();
  const { signInWithGoogle, isLoading: isSocialLoading } = useClerkSocialAuth();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 1. If user is already authenticated, immediately route them away from login
  useEffect(() => {
    if (isAuthenticated) {
      if (user && user.isEmailVerified === false) {
        router.replace('/(auth)/verify-email');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, user, router]);

  // 2. Clear any stale tokens if unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      TokenManager.clearTokens();
    }
  }, [isAuthenticated]);

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setEmailError('Email is required');
      toast.error('Email address is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setEmailError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      if (valid) toast.error('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      if (valid) toast.error('Password must be at least 6 characters');
      valid = false;
    }

    return valid;
  };

  // Direct Credentials Sign In
  const handleLogin = async () => {
    if (!validate()) return;

    try {
      const response = await loginMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        password,
      });

      // Step-Up 2FA / OTP requirement
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

      // Update Auth Store
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

      // Navigate to Dashboard
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Authentication failed. Please verify your credentials.';
      toast.error(msg);
    }
  };

  // Google Social Sign In via Clerk
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(router);
    } catch (err: any) {
      const msg = err?.message || 'Google sign-in could not be completed.';
      toast.error(msg);
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
        {/* Email Input */}
        <Input
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (emailError) setEmailError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<Mail size={18} color={theme.iconMuted} />}
          error={emailError}
        />

        {/* Password Input */}
        <Input
          label="Password"
          placeholder="Enter your account password"
          value={password}
          onChangeText={(val) => {
            setPassword(val);
            if (passwordError) setPasswordError('');
          }}
          isPassword
          leftIcon={<Lock size={18} color={theme.iconMuted} />}
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
            <Globe size={18} color={theme.primary} />
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
            <ExternalLink size={14} color={theme.iconMuted} />
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
