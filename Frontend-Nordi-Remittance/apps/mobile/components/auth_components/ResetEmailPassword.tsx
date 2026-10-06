// ============================================================================
// RESET EMAIL / PASSWORD — React Native component
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@nordi/shared/constants/colors';

// ========================
// TYPES
// ========================
type Step = 'email' | 'otp' | 'newPassword' | 'success';

interface ResetEmailPasswordProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ========================
// COMPONENT
// ========================
const ResetEmailPassword: React.FC<ResetEmailPasswordProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail]       = useState('');
  const [otp, setOtp]           = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Step-change animation
  const cardOpacity    = useSharedValue(1);
  const cardTranslateX = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateX: cardTranslateX.value }],
  }));

  const goToStep = (next: Step) => {
    cardOpacity.value    = withTiming(0, { duration: 150 }, () => {
      cardOpacity.value    = withTiming(1, { duration: 250 });
      cardTranslateX.value = withSpring(0, { stiffness: 300, damping: 20 });
    });
    cardTranslateX.value = withTiming(40, { duration: 150 });
    setTimeout(() => setStep(next), 150);
  };

  // ---- Fake handlers (wire up real API calls) ----
  const handleSendEmail = async () => {
    if (!email) return setError('Please enter your email address.');
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200)); // replace with API call
    setLoading(false);
    goToStep('otp');
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return setError('Please enter the 6-digit code.');
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    goToStep('newPassword');
  };

  const handleResetPassword = async () => {
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    goToStep('success');
    setTimeout(() => onSuccess?.(), 2000);
  };

  // ========================
  // RENDER STEPS
  // ========================
  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <Text style={styles.stepTitle}>Forgot Password?</Text>
            <Text style={styles.stepSubtitle}>
              Enter your registered email address and we'll send you a reset code.
            </Text>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.neutral[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSendEmail} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>
          </>
        );

      case 'otp':
        return (
          <>
            <Text style={styles.stepTitle}>Enter OTP Code</Text>
            <Text style={styles.stepSubtitle}>
              We've sent a 6-digit code to{' '}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.label}>Verification Code</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="keypad-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={colors.neutral[400]}
                value={otp}
                onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Verify Code</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => goToStep('email')} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Resend Code</Text>
            </TouchableOpacity>
          </>
        );

      case 'newPassword':
        return (
          <>
            <Text style={styles.stepTitle}>New Password</Text>
            <Text style={styles.stepSubtitle}>
              Choose a strong password with at least 8 characters.
            </Text>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter new password"
                placeholderTextColor={colors.neutral[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(s => !s)} style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.label, { marginTop: 16 }]}>Confirm Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Confirm new password"
                placeholderTextColor={colors.neutral[400]}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPassword}
              />
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleResetPassword} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        );

      case 'success':
        return (
          <View style={styles.successBlock}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success[500]} />
            </View>
            <Text style={styles.stepTitle}>Password Reset!</Text>
            <Text style={styles.stepSubtitle}>
              Your password has been updated successfully. Redirecting you to login…
            </Text>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Progress indicator */}
        <View style={styles.progressBar}>
          {(['email', 'otp', 'newPassword', 'success'] as Step[]).map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                step === s
                  ? { backgroundColor: colors.primary[500], width: 24 }
                  : ['otp', 'newPassword', 'success'].indexOf(s) <=
                    ['otp', 'newPassword', 'success'].indexOf(step)
                    ? { backgroundColor: colors.success[400] }
                    : {},
              ]}
            />
          ))}
        </View>

        {renderStep()}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.error[600]} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {onCancel && step !== 'success' && (
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

// ========================
// STYLES
// ========================
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: 24,
    gap: 4,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
    lineHeight: 20,
    marginBottom: 24,
  },
  emailHighlight: {
    fontWeight: '600',
    color: colors.primary[600],
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 8,
    backgroundColor: colors.neutral[50],
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.neutral[900],
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  primaryBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryBtn: {
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  secondaryBtnText: {
    color: colors.primary[600],
    fontWeight: '600',
    fontSize: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.error[50],
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.error[700],
    flex: 1,
  },
  cancelBtn: {
    alignItems: 'center',
    padding: 12,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 14,
    color: colors.neutral[400],
  },
  successBlock: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successIcon: {
    marginBottom: 16,
  },
});

export default ResetEmailPassword;