// ============================================================================
// RECENT ACTIVITY SCREEN — Chronological account movements
// Connected to shared useClientRecentTransactions
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { TransactionItem } from '@/components/banking/TransactionItem';
import { QuerySection } from '@/components/shared/QuerySection';
import { useClientRecentTransactions } from '@nordi/shared/client-usecase';

export default function RecentActivityScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const { transactions, isLoading, error } = useClientRecentTransactions(20);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Recent Account Activity"
        subtitle="Real-time timeline of incoming & outgoing activity"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <QuerySection isLoading={isLoading} error={error}>
          {(transactions?.length ? transactions : [
            { id: '1', title: 'Salary Deposit', description: 'Acme Corp', amount: 4850, currency: 'USD', type: 'credit', status: 'completed', category: 'deposit', date: 'Today' },
            { id: '2', title: 'Coffee & Bites', description: 'Starbucks UK', amount: 5.40, currency: 'USD', type: 'debit', status: 'completed', category: 'card', date: 'Today' },
            { id: '3', title: 'Transfer to Alice', description: 'SwiftPay P2P', amount: 35.00, currency: 'USD', type: 'debit', status: 'completed', category: 'transfer', date: 'Yesterday' },
          ]).map((tx: any) => (
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
            />
          ))}
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
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
  });
}
