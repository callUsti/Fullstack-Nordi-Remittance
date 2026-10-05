// ============================================================================
// SESSION EXPIRED MODAL — React Native Banking-Grade Modal
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Lock, Clock, AlertTriangle } from 'lucide-react-native';
import type { SessionExpiredReason } from '@/core/auth/session.manager';
import { Button } from '@/components/ui';

interface SessionExpiredModalProps {
  isOpen: boolean;
  mode: 'warning' | 'expired';
  reason?: SessionExpiredReason;
  countdown?: number;
  onExtend?: () => void;
  onRedirect?: () => void;
}

const REASON_MESSAGES: Record<SessionExpiredReason, { title: string; message: string }> = {
  token_expired: {
    title: 'Session Expired',
    message: 'Your banking session has expired. Please sign in again to continue.',
  },
  inactivity: {
    title: 'Session Timed Out',
    message: "You've been inactive for too long. For your security, you have been signed out.",
  },
  session_revoked: {
    title: 'Session Revoked',
    message: 'Your session was ended by an administrator. Please sign in again.',
  },
  account_locked: {
    title: 'Account Locked',
    message: 'Your account has been temporarily locked. Please contact support.',
  },
  manual_logout: {
    title: 'Signed Out',
    message: 'You have been signed out successfully.',
  },
  concurrent_session: {
    title: 'Signed In Elsewhere',
    message: 'Your account was accessed from another device. This session has ended.',
  },
};

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  mode,
  reason = 'token_expired',
  countdown = 60,
  onExtend,
  onRedirect,
}) => {
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    if (mode !== 'expired' || !isOpen) return;
    setRedirectCountdown(5);

    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onRedirect?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, isOpen, onRedirect]);

  const reasonInfo = REASON_MESSAGES[reason] || REASON_MESSAGES.token_expired;

  return (
    <Modal visible={isOpen} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <View className="w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-900 p-6 shadow-2xl items-center">
          {/* Header Icon */}
          <View className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 items-center justify-center mb-4">
            {mode === 'warning' ? (
              <Clock size={32} color="#F59E0B" />
            ) : (
              <Lock size={32} color="#EF4444" />
            )}
          </View>

          {/* Title */}
          <Text className="text-lg font-bold text-neutral-900 dark:text-white text-center mb-2">
            {mode === 'warning' ? 'Session Timeout Warning' : reasonInfo.title}
          </Text>

          {/* Message */}
          <Text className="text-xs text-neutral-600 dark:text-neutral-400 text-center leading-relaxed mb-6">
            {mode === 'warning'
              ? `Due to inactivity, your session will automatically end in ${countdown} seconds.`
              : reasonInfo.message}
          </Text>

          {/* Actions */}
          <View className="w-full space-y-3">
            {mode === 'warning' ? (
              <>
                <Button variant="primary" size="lg" fullWidth onPress={onExtend}>
                  Stay Signed In
                </Button>
                <Button variant="ghost" size="md" fullWidth onPress={onRedirect}>
                  Sign Out Now
                </Button>
              </>
            ) : (
              <Button variant="primary" size="lg" fullWidth onPress={onRedirect}>
                {`Sign In (${redirectCountdown}s)`}
              </Button>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SessionExpiredModal;
