// ============================================================================
// TRANSFER PRIMITIVES — React Native components for send-money wizard
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@nordi/shared/constants/colors';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

export interface WizardStep {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface AccountOption {
  id: string;
  name?: string;
  walletType?: string;
  accountNumber?: string;
  balance?: number;
  currency?: string;
  [key: string]: unknown;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSFER LAYOUT
   ═══════════════════════════════════════════════════════════════════════════ */
export const TransferLayout: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => {
  const theme = useMobileTheme();
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }, style]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   STEP INDICATOR
   ═══════════════════════════════════════════════════════════════════════════ */
export const StepIndicator: React.FC<{
  steps: WizardStep[];
  current: number;
}> = ({ steps, current }) => {
  const theme = useMobileTheme();
  return (
  <View style={styles.stepContainer}>
    {steps.map((step, i) => {
      const isCompleted = i < current;
      const isCurrent = i === current;

      return (
        <React.Fragment key={i}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepBadge,
                isCompleted
                  ? styles.stepCompleted
                  : isCurrent
                    ? styles.stepActive
                    : [styles.stepInactive, { backgroundColor: theme.surfaceAlt }],
              ]}
            >
              {isCompleted ? (
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    isCurrent
                      ? styles.stepNumberActive
                      : [styles.stepNumberInactive, { color: theme.textMuted }],
                  ]}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                isCurrent && styles.stepLabelActive,
                isCompleted && styles.stepLabelCompleted,
                !isCurrent && !isCompleted && { color: theme.textMuted },
              ]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </View>
          {i < steps.length - 1 && (
            <View
              style={[
                styles.stepLine,
                i < current
                  ? styles.stepLineActive
                  : [styles.stepLineInactive, { backgroundColor: theme.border }],
              ]}
            />
          )}
        </React.Fragment>
      );
    })}
  </View>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   AMOUNT INPUT
   ═══════════════════════════════════════════════════════════════════════════ */
export interface AmountInputProps {
  value: string;
  onChangeValue: (val: string) => void;
  currency?: string;
  maxAmount?: number;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChangeValue,
  currency = 'USD',
  maxAmount,
}) => {
  const theme = useMobileTheme();
  return (
  <View style={[styles.amountCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <Text style={[styles.amountLabel, { color: theme.textMuted }]}>You send</Text>
    <View style={styles.amountRow}>
      <Text style={[styles.currencySymbol, { color: theme.text }]}>{currency}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeValue}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={theme.textMuted}
        style={[styles.amountTextInput, { color: theme.text }]}
      />
    </View>
    {maxAmount !== undefined && (
      <View style={styles.balanceRow}>
        <Text style={[styles.balanceText, { color: theme.textMuted }]}>
          Available: {currency} {maxAmount.toLocaleString()}
        </Text>
        <TouchableOpacity onPress={() => onChangeValue(String(maxAmount))}>
          <Text style={styles.useMaxText}>USE MAX</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ACCOUNT SELECTOR TILE
   ═══════════════════════════════════════════════════════════════════════════ */
export interface AccountTileProps {
  account: AccountOption;
  isSelected: boolean;
  onSelect: () => void;
}

export const AccountTile: React.FC<AccountTileProps> = ({
  account,
  isSelected,
  onSelect,
}) => {
  const theme = useMobileTheme();
  return (
  <TouchableOpacity
    onPress={onSelect}
    activeOpacity={0.7}
    style={[
      styles.accountTile,
      { backgroundColor: theme.surface, borderColor: theme.border },
      isSelected && [styles.accountTileSelected, { backgroundColor: theme.primarySoft }],
    ]}
  >
    <View style={[styles.accountIcon, { backgroundColor: theme.surfaceAlt }]}>
      <Ionicons
        name={account.walletType === 'crypto' ? 'logo-bitcoin' : 'card'}
        size={22}
        color={isSelected ? colors.primary.DEFAULT : theme.iconMuted}
      />
    </View>
    <View style={styles.accountInfo}>
      <Text style={[styles.accountName, { color: theme.text }]}>{account.name || 'Account'}</Text>
      <Text style={[styles.accountNumber, { color: theme.textMuted }]}>
        {account.accountNumber ? `•••• ${account.accountNumber.slice(-4)}` : account.id}
      </Text>
    </View>
    <View style={styles.accountBalance}>
      <Text style={[styles.balanceValue, { color: theme.text }]}>
        {account.currency || '$'} {account.balance?.toLocaleString() || '0.00'}
      </Text>
    </View>
    {isSelected && (
      <Ionicons
        name="checkmark-circle"
        size={20}
        color={colors.primary.DEFAULT}
        style={styles.checkIcon}
      />
    )}
  </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 16,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCompleted: {
    backgroundColor: '#10b981',
  },
  stepActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  stepInactive: {
    backgroundColor: '#e2e8f0',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepNumberInactive: {
    color: '#64748b',
  },
  stepLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  stepLabelCompleted: {
    color: '#10b981',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 6,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: '#10b981',
  },
  stepLineInactive: {
    backgroundColor: '#e2e8f0',
  },
  amountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 8,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  balanceText: {
    fontSize: 12,
    color: '#64748b',
  },
  useMaxText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  accountTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  accountTileSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: '#f0f7ff',
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  accountNumber: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  accountBalance: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  checkIcon: {
    marginLeft: 4,
  },
});
