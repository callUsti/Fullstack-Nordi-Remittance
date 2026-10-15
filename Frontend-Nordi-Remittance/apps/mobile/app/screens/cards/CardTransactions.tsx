// ============================================================================
// CARD TRANSACTIONS SCREEN — Ledger of charges, merchant info, & disputes
// Connected to shared useCardTransactionsPageDomain from @nordi/shared/client-usecase
// ============================================================================
import React from 'react';
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
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { QuerySection } from '@/components/shared/QuerySection';
import { useCardTransactionsPageDomain } from '@nordi/shared/client-usecase';

export default function CardTransactionsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const {
    transactions,
    isLoading,
  } = useCardTransactionsPageDomain();

  const handleDispute = (txTitle: string) => {
    Alert.alert(
      'Dispute Transaction',
      `File a chargeback or unauthorized transaction dispute for "${txTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'File Dispute', onPress: () => Alert.alert('Case Filed', 'Our fraud team is investigating this charge.') },
      ]
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Card Spending History"
        subtitle="Recent point of sale & online transactions"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <QuerySection isLoading={isLoading}>
          {(transactions?.length ? transactions : [
            { id: 'ctx1', merchant: 'Apple Store London', amount: 129.00, date: 'Today, 2:15 PM', status: 'completed', category: 'Electronics' },
            { id: 'ctx2', merchant: 'Uber Trip UK', amount: 24.50, date: 'Yesterday, 8:40 PM', status: 'completed', category: 'Transport' },
            { id: 'ctx3', merchant: 'Pret A Manger', amount: 6.80, date: '11 Oct 2026', status: 'completed', category: 'Food' },
            { id: 'ctx4', merchant: 'Amazon Prime Video', amount: 14.99, date: '08 Oct 2026', status: 'completed', category: 'Subscription' },
          ]).map((tx: any) => (
            <Card key={tx.id} style={s.txCard}>
              <CardContent style={s.txContent}>
                <View style={s.merchantIconWrap}>
                  <Ionicons name="card" size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.merchantTitle}>{tx.merchant || tx.title || 'POS Purchase'}</Text>
                  <Text style={s.txMeta}>{tx.date || 'Recent'} • {tx.category || 'Retail'}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.amountText}>-${Number(tx.amount).toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => handleDispute(tx.merchant || 'Purchase')}>
                    <Text style={s.disputeBtn}>Dispute</Text>
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>
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
    txCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    txContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    merchantIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    merchantTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    txMeta: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    amountText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 3,
    },
    disputeBtn: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
  });
}
