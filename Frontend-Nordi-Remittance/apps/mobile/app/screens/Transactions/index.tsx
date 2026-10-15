// ============================================================================
// TRANSACTIONS SCREEN — Full Ledger, Filtered Search & Scheduled Transfers
// Connected to shared useClientTransactions, TransactionItem, and SubNavTabs
// ============================================================================
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader, SubNavTabs } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/shared/SearchInput';
import { TransactionItem } from '@/components/banking/TransactionItem';
import { QuerySection } from '@/components/shared/QuerySection';
import { useClientTransactions } from '@nordi/shared/client-usecase';
import { useTransactionStore } from '@nordi/shared/store';

const TABS = [
  { key: 'recent', label: 'All Transactions' },
  { key: 'income', label: 'Credits' },
  { key: 'expense', label: 'Debits' },
  { key: 'scheduled', label: 'Scheduled' },
];

export default function TransactionsScreen() {
  const { globalFilters, updateGlobalFilters } = useTransactionStore();
  const activeTab = globalFilters.type || 'recent';
  const setActiveTab = (tab: string) => updateGlobalFilters({ type: tab === 'recent' ? 'all' : tab });
  const search = globalFilters.search;
  const setSearch = (q: string) => updateGlobalFilters({ search: q });
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const { transactions: rawList, isLoading, error, refetch } = useClientTransactions();

  const transactions = useMemo(() => {
    if (rawList && rawList.length > 0) {
      return rawList.map((tx: any) => ({
        id: tx.id || tx.transactionId || String(Math.random()),
        title: tx.title || tx.recipientName || tx.description || 'Remittance Transfer',
        description: tx.description || tx.reference || 'Bank Transfer',
        amount: Math.abs(Number(tx.amount || 0)),
        currency: tx.currency || 'USD',
        type: (tx.type === 'credit' || tx.amount > 0 ? 'credit' : 'debit') as 'credit' | 'debit',
        status: (tx.status?.toLowerCase() || 'completed') as any,
        category: (tx.category?.toLowerCase() || 'transfer') as any,
        date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Recent',
        time: tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM',
        reference: tx.reference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      }));
    }

    return [
      {
        id: '1',
        title: 'International Wire to Kenya',
        description: 'Recipient: Mary Wanjiku',
        amount: 450.00,
        currency: 'USD',
        type: 'debit' as const,
        status: 'completed' as const,
        category: 'transfer' as const,
        date: 'Today',
        time: '14:22 PM',
        reference: 'TXN-984210',
      },
      {
        id: '2',
        title: 'Salary Direct Deposit',
        description: 'Employer: Acme Financial Services',
        amount: 4850.00,
        currency: 'USD',
        type: 'credit' as const,
        status: 'completed' as const,
        category: 'deposit' as const,
        date: 'Yesterday',
        time: '09:00 AM',
        reference: 'TXN-984209',
      },
      {
        id: '3',
        title: 'Virtual Card Charge - AWS',
        description: 'Amazon Web Services Cloud',
        amount: 84.20,
        currency: 'USD',
        type: 'debit' as const,
        status: 'completed' as const,
        category: 'card' as const,
        date: '10 Oct 2026',
        time: '02:14 AM',
        reference: 'TXN-984180',
      },
    ];
  }, [rawList]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        tx.title.toLowerCase().includes(search.toLowerCase()) ||
        tx.description.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (activeTab === 'income') return tx.type === 'credit';
      if (activeTab === 'expense') return tx.type === 'debit';
      return true;
    });
  }, [transactions, search, activeTab]);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Transactions & Activity"
        subtitle="Complete ledger of all account debits & credits"
        showBack
        onBackPress={() => router.back()}
        rightElement={
          <TouchableOpacity
            style={s.downloadBtn}
            onPress={() => router.push('/screens/transactions/DownloadStatement' as any)}
          >
            <Ionicons name="download-outline" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      <SubNavTabs
        tabs={TABS}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      <View style={s.searchWrap}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by title, recipient, or note..."
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <QuerySection isLoading={isLoading} error={error} onRetry={refetch}>
          {activeTab === 'scheduled' ? (
            <Card style={s.scheduledCard}>
              <CardContent style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="time" size={22} color={theme.colors.primary} />
                  <Text style={[s.sectionTitle, { marginLeft: 10 }]}>Standing Orders & Recurring</Text>
                </View>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 14 }}>
                  You have 2 scheduled recurring transfers setup for this month.
                </Text>
                <Button
                  title="View Scheduled Transfers"
                  variant="primary"
                  size="sm"
                  onPress={() => router.push('/screens/transactions/ScheduledTransfers' as any)}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {filtered.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  title={tx.title}
                  description={tx.description}
                  amount={tx.amount}
                  currency={tx.currency}
                  type={tx.type}
                  status={tx.status}
                  category={tx.category}
                  date={tx.date}
                  time={tx.time}
                  reference={tx.reference}
                  onPress={() => {
                    Alert.alert(
                      'Transaction Details',
                      `${tx.title}\nAmount: $${tx.amount.toFixed(2)} ${tx.currency}\nRef: ${tx.reference}\nStatus: ${tx.status.toUpperCase()}\nDate: ${tx.date} ${tx.time}`
                    );
                  }}
                />
              ))}
            </>
          )}
        </QuerySection>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    downloadBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${theme.colors.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchWrap: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    scrollContent: {
      padding: 16,
      paddingTop: 4,
      paddingBottom: 40,
    },
    scheduledCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
  });
}
