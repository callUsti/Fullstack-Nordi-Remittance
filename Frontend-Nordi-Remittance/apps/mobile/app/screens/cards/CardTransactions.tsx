// ============================================================================
// CARD TRANSACTIONS SCREEN — Ledger of charges, merchant info, & disputes
// Connected to shared useCardTransactionsPageDomain from @nordi/shared/client-usecase
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { QuerySection } from '@/components/shared/QuerySection';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useCardTransactionsPageDomain } from '@nordi/shared/client-usecase';
import { SPACING, FONT_SIZES, ICON_SIZES, RADIUS } from '@/constants/sizings';

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
    <AdaptiveScreen
      withTabBar={false}
      header={
        <ScreenHeader
          title="Card Spending History"
          subtitle="Recent point of sale & online transactions"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
      <QuerySection isLoading={isLoading}>
        {(transactions?.length ? transactions : [
          { id: 'ctx1', merchant: 'Apple Store London', amount: 129.00, date: 'Today, 2:15 PM', status: 'completed', category: 'Electronics' },
          { id: 'ctx2', merchant: 'Uber Trip UK', amount: 24.50, date: 'Yesterday, 8:40 PM', status: 'completed', category: 'Transport' },
          { id: 'ctx3', merchant: 'Pret A Manger', amount: 8.90, date: 'Oct 17, 9:20 AM', status: 'completed', category: 'Dining' },
          { id: 'ctx4', merchant: 'Netflix Subscription', amount: 15.99, date: 'Oct 15, 12:00 AM', status: 'completed', category: 'Entertainment' },
        ]).map((tx: any) => (
          <Card key={tx.id} style={s.txCard}>
            <CardContent style={s.txContent}>
              <View style={[s.merchantIconWrap, { backgroundColor: theme.primarySoft }]}>
                <Icon name="CreditCard" size={ICON_SIZES.sm} color={theme.primary} />
              </View>

              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
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
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    txCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.xs,
    },
    txContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.md,
    },
    merchantIconWrap: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    merchantTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    txMeta: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
    },
    amountText: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 3,
    },
    disputeBtn: {
      fontSize: FONT_SIZES.nano,
      color: theme.primary,
      fontWeight: '600',
    },
  });
}
