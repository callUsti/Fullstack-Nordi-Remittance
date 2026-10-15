// ============================================================================
// TRANSACTION HISTORY — Full searchable & filterable transaction ledger
// ============================================================================
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { TransactionItem } from '@/components/banking/TransactionItem';
import { QuerySection } from '@/components/shared/QuerySection';
import { Badge } from '@/components/ui/Badge';
import { useClientTransactions } from '@nordi/shared/client-usecase';

const FILTERS = ['All', 'Credits', 'Debits', 'Pending'];

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const txQuery = useClientTransactions();
  const rawList = ((txQuery as any).transactions ?? (txQuery as any).data ?? []) as any[];

  const transactions = useMemo(() => {
    return rawList
      .map((tx: any) => ({
        id: tx.id || String(Math.random()),
        title: tx.title || tx.recipientName || tx.description || 'Transfer',
        description: tx.description || tx.reference || '',
        amount: Math.abs(Number(tx.amount || 0)),
        currency: tx.currency || 'USD',
        type: (tx.type === 'credit' || tx.amount > 0 ? 'credit' : 'debit') as 'credit' | 'debit',
        status: (tx.status?.toLowerCase() || 'completed') as any,
        date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
      }))
      .filter((tx) => {
        const matchSearch = !search || tx.title.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
          filter === 'All' ||
          (filter === 'Credits' && tx.type === 'credit') ||
          (filter === 'Debits' && tx.type === 'debit') ||
          (filter === 'Pending' && tx.status === 'pending');
        return matchSearch && matchFilter;
      });
  }, [rawList, search, filter]);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Transaction History"
        subtitle="Your complete payment ledger"
        showBack
        onBackPress={() => router.back()}
      />

      <View style={s.controls}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search transactions..."
          style={s.search}
        />
        <View style={s.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, filter === f && s.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <QuerySection query={txQuery} loadingRows={8}>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() => {}}
            />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="document-text-outline" size={40} color={theme.colors.textSecondary} />
              <Text style={s.emptyText}>No transactions found</Text>
            </View>
          }
        />
      </QuerySection>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    controls: { paddingHorizontal: 16, paddingTop: 8 },
    search: { marginBottom: 10 },
    filters: { flexDirection: 'row', gap: 8, paddingBottom: 10 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    filterChipActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}15` },
    filterText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
    filterTextActive: { color: theme.colors.primary, fontWeight: '700' },
    list: { padding: 16, paddingBottom: 40 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyText: { fontSize: 14, color: theme.colors.textSecondary },
  });
}
