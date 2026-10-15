// ============================================================================
// HOME SERVICES COMPONENT — Nordi Remittance Mobile
// Clean, compact luxury header, balance display, and 8-item banking services grid
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import services from '@/constants/HomeRoutes';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { useClientDashboard } from '@nordi/shared/client-usecase';
import { useUserProfile } from '@nordi/shared/hooks/api-queries/useUsers';

interface HomeServicesProps {
  onSeeCharts?: () => void;
}

export const HomeServices: React.FC<HomeServicesProps> = ({ onSeeCharts }) => {
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  // Real client dashboard and profile data via TanStack Query hooks
  const { account, unreadCount } = useClientDashboard();
  const { data: profileRaw } = useUserProfile();

  const userProfile = (profileRaw as any)?.data || (profileRaw as any) || {};
  const firstName =
    userProfile?.firstName ||
    userProfile?.name?.split(' ')[0] ||
    'Member';

  const totalBalance = account?.totalBalance ?? 24562.8;

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(totalBalance);

  return (
    <View style={styles.container}>
      {/* ── Top App Bar (Compact & Sleek) ── */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => router.push('/screens/profile' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() || 'U'}</Text>
            <View style={styles.statusDot} />
          </TouchableOpacity>

          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name} numberOfLines={1}>
              {firstName}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/screens/Homescreens/MoreOptions' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={18} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/screens/profile' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={18} color={theme.text} />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Compact Nordi Premium Balance Card ── */}
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#1e3a8a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceHeader}>
          <View style={styles.walletTag}>
            <View style={styles.walletDot} />
            <Text style={styles.walletTagText}>USD Checking •••• 1234</Text>
          </View>

          <TouchableOpacity
            onPress={() => setIsBalanceHidden(!isBalanceHidden)}
            style={styles.eyeButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isBalanceHidden ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#94a3b8"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceBody}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {isBalanceHidden ? '••••••••' : formattedBalance}
          </Text>
        </View>

        {/* ── Micro Quick Actions Row ── */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/screens/send-money' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#2563eb' }]}>
              <Ionicons name="paper-plane" size={16} color="#ffffff" />
            </View>
            <Text style={styles.quickActionText}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/screens/forex' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#0891b2' }]}>
              <Ionicons name="swap-horizontal" size={16} color="#ffffff" />
            </View>
            <Text style={styles.quickActionText}>Convert</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/screens/cards' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#475569' }]}>
              <Ionicons name="card" size={16} color="#ffffff" />
            </View>
            <Text style={styles.quickActionText}>Cards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={onSeeCharts || (() => router.push('/screens/banking/transactions' as any))}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#7c3aed' }]}>
              <Ionicons name="stats-chart" size={16} color="#ffffff" />
            </View>
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Banking Services Grid (Small & Clean Spacing) ── */}
      <View style={styles.servicesContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Banking Services</Text>
          <TouchableOpacity
            onPress={() => router.push('/screens/Homescreens/MoreOptions' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>All Services</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.servicesGrid}>
          {services.flat().map((service) => (
            <Pressable
              key={service.id}
              style={({ pressed }) => [
                styles.serviceItem,
                pressed && styles.serviceItemPressed,
              ]}
              onPress={() => router.push(service.route as any)}
            >
              <View
                style={[
                  styles.serviceIconContainer,
                  { backgroundColor: service.bg },
                ]}
              >
                <Ionicons
                  name={service.icon as any}
                  size={20}
                  color={service.color}
                />
              </View>
              <Text style={styles.serviceName} numberOfLines={1}>
                {service.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

export default HomeServices;

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 0,
      paddingTop: 4,
      paddingBottom: 10,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    avatarCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    avatarText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },
    statusDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#22c55e',
      borderWidth: 2,
      borderColor: theme.background,
    },
    greeting: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.textMuted,
      letterSpacing: -0.2,
    },
    name: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.3,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      position: 'relative',
    },
    unreadBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: '#ef4444',
      borderRadius: 9,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    unreadText: {
      color: '#ffffff',
      fontSize: 9,
      fontWeight: '700',
    },
    balanceCard: {
      marginHorizontal: 0,
      marginTop: 4,
      marginBottom: 12,
      borderRadius: 20,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    balanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    walletTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      gap: 5,
    },
    walletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#38bdf8',
    },
    walletTagText: {
      color: '#cbd5e1',
      fontSize: 11,
      fontWeight: '600',
    },
    eyeButton: {
      padding: 4,
    },
    balanceBody: {
      marginBottom: 16,
    },
    balanceLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: '#94a3b8',
      marginBottom: 2,
    },
    balanceAmount: {
      fontSize: 28,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: -0.6,
    },
    quickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.1)',
    },
    quickActionItem: {
      alignItems: 'center',
      flex: 1,
    },
    quickActionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    quickActionText: {
      color: '#e2e8f0',
      fontSize: 11,
      fontWeight: '600',
    },
    servicesContainer: {
      paddingHorizontal: 0,
      paddingTop: 4,
      paddingBottom: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.3,
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    servicesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: 12,
    },
    serviceItem: {
      width: '25%',
      alignItems: 'center',
      paddingVertical: 2,
    },
    serviceItemPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.96 }],
    },
    serviceIconContainer: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 5,
    },
    serviceName: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
    },
  });
