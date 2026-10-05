// ============================================================================
// DASHBOARD UI PRIMITIVES — React Native shared components for mobile
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@nordi/shared/constants/colors';

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE CONTAINER — Wraps page screens
   ═══════════════════════════════════════════════════════════════════════════ */
export interface PageContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, style }) => (
  <View style={[styles.pageContainer, style]}>{children}</View>
);

/* ═══════════════════════════════════════════════════════════════════════════
   DASH CARD — Elevated card container
   ═══════════════════════════════════════════════════════════════════════════ */
export interface DashCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const DashCard: React.FC<DashCardProps> = ({
  children,
  onPress,
  style,
  padding = 'md',
}) => {
  const paddingStyle =
    padding === 'none'
      ? { padding: 0 }
      : padding === 'sm'
      ? { padding: 12 }
      : padding === 'lg'
      ? { padding: 24 }
      : { padding: 16 };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.card, paddingStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, paddingStyle, style]}>{children}</View>;
};

/* ═══════════════════════════════════════════════════════════════════════════
   STAT CARD — Stats display
   ═══════════════════════════════════════════════════════════════════════════ */
export interface StatCardProps {
  label: string;
  value: string | number;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  change?: string;
  positive?: boolean;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  iconName = 'wallet',
  iconColor = colors.primary.DEFAULT,
  change,
  positive = true,
  onPress,
}) => (
  <DashCard onPress={onPress} style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={[styles.statIconBadge, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    {change ? (
      <View style={styles.changeRow}>
        <Ionicons
          name={positive ? 'arrow-up' : 'arrow-down'}
          size={12}
          color={positive ? '#10b981' : '#ef4444'}
        />
        <Text
          style={[styles.changeText, { color: positive ? '#10b981' : '#ef4444' }]}
        >
          {change}
        </Text>
      </View>
    ) : null}
  </DashCard>
);

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════════════════════════ */
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onActionPress,
}) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleCol}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
    {actionText && onActionPress ? (
      <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
        <Text style={styles.sectionActionText}>{actionText}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

/* ═══════════════════════════════════════════════════════════════════════════
   QUICK ACTION BUTTON
   ═══════════════════════════════════════════════════════════════════════════ */
export interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  onPress,
  color = colors.primary.DEFAULT,
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.quickAction}>
    <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

/* ═══════════════════════════════════════════════════════════════════════════
   SEARCH INPUT
   ═══════════════════════════════════════════════════════════════════════════ */
export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
}) => (
  <View style={styles.searchContainer}>
    <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      style={styles.searchInput}
    />
    {value.length > 0 && onClear ? (
      <TouchableOpacity onPress={onClear}>
        <Ionicons name="close-circle" size={16} color="#94a3b8" />
      </TouchableOpacity>
    ) : null}
  </View>
);

/* ═══════════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════════════════ */
export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconWrapper}>
      <Ionicons name={icon} size={40} color="#94a3b8" />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyDescription}>{description}</Text>
    {actionLabel && onAction ? (
      <TouchableOpacity
        onPress={onAction}
        style={styles.emptyActionButton}
        activeOpacity={0.7}
      >
        <Text style={styles.emptyActionText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  statCard: {
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    marginTop: 16,
  },
  sectionTitleCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  sectionActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  quickAction: {
    alignItems: 'center',
    padding: 8,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 240,
  },
  emptyActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 10,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
