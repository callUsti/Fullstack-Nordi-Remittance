// ============================================================================
// USER ELIGIBILITY MODAL — React Native
// ============================================================================

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@nordi/shared/constants/colors';
import { useUpdateUserStatus } from '@nordi/shared/hooks/api-queries/useAdmin';
import { useAdminReviewKyc } from '@nordi/shared/hooks/api-queries/useKyc';

export type EligibilityBlockType =
  | 'KYC_PENDING'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_BANNED'
  | 'ACCOUNT_INACTIVE';

export interface EligibilityErrorDetails {
  userId: string;
  userName: string;
  email?: string;
  blockType: EligibilityBlockType;
  reason?: string;
  kycStatus?: string;
}

interface UserEligibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: EligibilityErrorDetails | null;
  onResolved?: () => void;
}

const ERROR_CODE_MAP: Record<string, EligibilityBlockType> = {
  E3005: 'KYC_PENDING',
  E1006: 'ACCOUNT_LOCKED',
  E1007: 'ACCOUNT_SUSPENDED',
  E1005: 'ACCOUNT_BANNED',
};

export function parseEligibilityError(error: unknown): EligibilityErrorDetails | null {
  const axiosErr = error as {
    response?: {
      data?: {
        error?: {
          code?: string;
          message?: string;
          details?: Record<string, unknown>;
        };
      };
    };
  };
  const apiError = axiosErr?.response?.data?.error;
  if (!apiError?.code || !apiError.details) return null;

  const blockType =
    (apiError.details.blockType as EligibilityBlockType) ||
    ERROR_CODE_MAP[apiError.code];
  if (!blockType) return null;

  return {
    userId: apiError.details.userId as string,
    userName: (apiError.details.userName as string) || 'User',
    email: apiError.details.email as string | undefined,
    blockType,
    reason: (apiError.details.reason as string) || apiError.message,
    kycStatus: apiError.details.kycStatus as string | undefined,
  };
}

const BLOCK_CONFIG: Record<
  EligibilityBlockType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bgColor: string;
    title: string;
    description: (name: string, reason?: string) => string;
    actionLabel: string;
  }
> = {
  KYC_PENDING: {
    icon: 'shield-half',
    color: '#d97706',
    bgColor: '#fef3c7',
    title: 'KYC Verification Required',
    description: (name, reason) =>
      `${name}'s KYC status is ${reason || 'pending'}. Financial operations are blocked until KYC is approved.`,
    actionLabel: 'Approve KYC',
  },
  ACCOUNT_LOCKED: {
    icon: 'lock-closed',
    color: '#e11d48',
    bgColor: '#ffe4e6',
    title: 'Account Locked',
    description: (name, reason) =>
      `${name}'s account is locked${reason ? `: ${reason}` : ''}. All financial operations are blocked.`,
    actionLabel: 'Unlock Account',
  },
  ACCOUNT_SUSPENDED: {
    icon: 'alert-circle',
    color: '#ea580c',
    bgColor: '#ffedd5',
    title: 'Account Suspended',
    description: (name) =>
      `${name}'s account is suspended. All financial operations are blocked until reactivated.`,
    actionLabel: 'Activate Account',
  },
  ACCOUNT_BANNED: {
    icon: 'close-circle',
    color: '#b91c1c',
    bgColor: '#fee2e2',
    title: 'Account Banned',
    description: (name) =>
      `${name}'s account has been banned. Contact a super admin to lift the ban.`,
    actionLabel: 'Activate Account',
  },
  ACCOUNT_INACTIVE: {
    icon: 'person-remove',
    color: '#475569',
    bgColor: '#f1f5f9',
    title: 'Account Inactive',
    description: (name) =>
      `${name}'s account is inactive and requires activation before any financial operations.`,
    actionLabel: 'Activate Account',
  },
};

export const UserEligibilityModal: React.FC<UserEligibilityModalProps> = ({
  isOpen,
  onClose,
  error,
  onResolved,
}) => {
  const updateStatus = useUpdateUserStatus();
  const reviewKyc = useAdminReviewKyc();

  if (!error) return null;

  const config = BLOCK_CONFIG[error.blockType];
  const isPending = updateStatus.isPending || reviewKyc.isPending;

  const handleResolve = () => {
    if (error.blockType === 'KYC_PENDING') {
      reviewKyc.mutate(
        {
          userId: error.userId,
          data: { status: 'approved' },
        },
        {
          onSuccess: () => {
            onResolved?.();
            onClose();
          },
        }
      );
    } else {
      updateStatus.mutate(
        {
          userId: error.userId as UUID,
          data: {
            status: 'active' as UserStatus,
            reason: 'Resolved eligibility block',
          },
        },
        {
          onSuccess: () => {
            onResolved?.();
            onClose();
          },
        }
      );
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon} size={32} color={config.color} />
          </View>

          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.description}>
            {config.description(error.userName, error.reason)}
          </Text>
          {error.email ? <Text style={styles.email}>{error.email}</Text> : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.dismissButton}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResolve}
              disabled={isPending}
              style={[styles.actionButton, isPending && styles.actionButtonDisabled]}
              activeOpacity={0.7}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.actionText}>{config.actionLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UserEligibilityModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
  email: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
