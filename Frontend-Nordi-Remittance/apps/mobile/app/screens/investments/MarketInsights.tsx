// ============================================================================
// MARKET INSIGHTS SCREEN — Macroeconomic & Portfolio Intelligence
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function MarketInsightsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const insights = [
    {
      title: 'Federal Reserve Policy Shift',
      desc: 'Interest rate pause signals potential strengthening for emerging market currencies and cross-border remittance corridor volume.',
      category: 'Macro',
      date: '12 Oct 2026',
    },
    {
      title: 'European SEPA Instant Expansion',
      desc: 'SEPA Instant settlement mandates take full effect across EU banks, reducing cross-border transfer clearing times to under 10 seconds.',
      category: 'Banking Rails',
      date: '08 Oct 2026',
    },
    {
      title: 'Digital Treasury Yield Momentum',
      desc: 'Short-term US Treasury yield vaults continue outperforming equity dividends with low risk volatility.',
      category: 'Fixed Income',
      date: '04 Oct 2026',
    },
  ];

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Market Insights & Reports"
        subtitle="Institutional macroeconomic research & trends"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {insights.map((item, idx) => (
          <Card key={idx} style={s.card}>
            <CardContent style={s.content}>
              <View style={s.headerRow}>
                <Badge variant="primary" size="sm">{item.category}</Badge>
                <Text style={s.dateText}>{item.date}</Text>
              </View>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.desc}>{item.desc}</Text>
            </CardContent>
          </Card>
        ))}
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
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    content: {
      padding: 16,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    dateText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 6,
    },
    desc: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
  });
}
