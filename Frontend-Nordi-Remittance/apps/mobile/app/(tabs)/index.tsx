// ============================================================================
// HOME SCREEN — Nordi Remittance Mobile
// Clean, compact, luxury overhaul with uniform cards, charts, and TanStack caching
// ============================================================================

import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import HomeServices from '@/components/home/HomeServices';
import HomeAnalyticsChart from '@/components/home/HomeAnalyticsChart';
import PartialCrypto from '@/components/home/PartialCrypto';
import FeaturedComponent from '@/components/home/Featured';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { TransactionItem } from '@/components/banking/TransactionItem';
import { QuerySection } from '@/components/shared/QuerySection';
import { useTransactions } from '@nordi/shared/hooks/api-queries/useTransactions';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);
  const scrollViewRef = useRef<ScrollView>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [chartsExpanded, setChartsExpanded] = useState(false);

  // TanStack Query for recent transactions
  const {
    data: transactionsData,
    isLoading,
    isError,
    refetch,
  } = useTransactions({ limit: 5 });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([refetch()]);
    setRefreshing(false);
  };

  const handleSeeCharts = () => {
    setChartsExpanded(true);
    scrollViewRef.current?.scrollTo({ y: 260, animated: true });
  };

  const recentTransactions = useMemo(() => {
    const list = Array.isArray(transactionsData)
      ? transactionsData
      : (transactionsData as any)?.data || [];

    if (list.length > 0) {
      return list.map((tx: any) => ({
        id: tx.id || tx.transactionId || String(Math.random()),
        title: tx.title || tx.recipientName || tx.description || tx.type || 'Transfer',
        description: tx.description || tx.category || 'Remittance',
        amount: Math.abs(Number(tx.amount || 0)),
        currency: tx.currency || 'USD',
        type: (tx.type === 'credit' || tx.amount > 0 ? 'credit' : 'debit') as 'credit' | 'debit',
        status: (tx.status?.toLowerCase() || 'completed') as any,
        category: (tx.category?.toLowerCase() || 'transfer') as any,
        date: tx.createdAt
          ? new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Recent',
      }));
    }

    // Default luxury fallback items when database is empty
    return [
      {
        id: '1',
        title: 'Nordi Remit Payroll',
        description: 'Direct Deposit • Work',
        amount: 4850.0,
        currency: 'USD',
        type: 'credit' as const,
        status: 'completed' as const,
        category: 'salary' as const,
        date: 'Today',
      },
      {
        id: '2',
        title: 'Global Wire Transfer',
        description: 'SwiftPay • London UK',
        amount: 320.0,
        currency: 'USD',
        type: 'debit' as const,
        status: 'completed' as const,
        category: 'transfer' as const,
        date: 'Yesterday',
      },
      {
        id: '3',
        title: 'Apple Services',
        description: 'Monthly Cloud Subscription',
        amount: 14.99,
        currency: 'USD',
        type: 'debit' as const,
        status: 'completed' as const,
        category: 'entertainment' as const,
        date: 'Oct 12',
      },
    ];
  }, [transactionsData]);

  const renderTransactionsSection = () => (
    <View style={styles.transactionsSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleGroup}>
          <Ionicons name="time-outline" size={16} color={theme.primary} />
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/screens/banking/transactions' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <QuerySection
        isLoading={isLoading}
        isError={isError}
        isEmpty={recentTransactions.length === 0}
        onRetry={refetch}
      >
        <View style={styles.transactionsList}>
          {recentTransactions.map((tx: any) => (
            <TransactionItem
              key={tx.id}
              id={tx.id}
              title={tx.title}
              description={tx.description}
              amount={tx.amount}
              currency={tx.currency}
              type={tx.type}
              status={tx.status}
              category={tx.category}
              date={tx.date}
              onPress={() => {
                router.push({
                  pathname: '/screens/banking/transactions' as any,
                  params: { selectedId: tx.id },
                });
              }}
            />
          ))}
        </View>
      </QuerySection>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AdaptiveScreen
        withTabBar={true}
        onRefresh={onRefresh}
        refreshing={refreshing}
        scrollViewRef={scrollViewRef}
      >
        {/* 1. Header + Dynamic Balance Card + Banking Services */}
        <HomeServices onSeeCharts={handleSeeCharts} />

        {/* 2. Financial Analytics & Cash Flow Chart Nudge */}
        <HomeAnalyticsChart initiallyExpanded={chartsExpanded} />

        {/* 3. 8 Equal-Height Crypto Cards with TanStack Query */}
        <PartialCrypto />

        {/* 4. 1-Tap Quick Transfer + Featured Campaign Slider */}
        <FeaturedComponent />

        {/* 5. Recent Activity List */}
        {renderTransactionsSection()}
      </AdaptiveScreen>
    </GestureHandlerRootView>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    transactionsSection: {
      backgroundColor: theme.surface,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
      marginHorizontal: 0,
      marginTop: 8,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    titleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.3,
    },
    seeAll: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    transactionsList: {
      gap: 4,
    },
  });
