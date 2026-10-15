// ============================================================================
// LIVE RATES SCREEN — Interbank FX Tickers & Market Changes
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

const RATES = [
  { pair: 'EUR / USD', rate: '1.0824', change: '+0.18%', isPositive: true },
  { pair: 'GBP / USD', rate: '1.2852', change: '-0.05%', isPositive: false },
  { pair: 'USD / CAD', rate: '1.3812', change: '+0.12%', isPositive: true },
  { pair: 'USD / NGN', rate: '1,640.50', change: '+0.45%', isPositive: true },
  { pair: 'USD / KES', rate: '129.20', change: '-0.20%', isPositive: false },
  { pair: 'USD / GHS', rate: '16.10', change: '+0.30%', isPositive: true },
  { pair: 'USD / ZAR', rate: '17.48', change: '-0.14%', isPositive: false },
];

export default function LiveRatesScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Live FX Market Rates"
        subtitle="Real-time institutional liquidity feeds"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {RATES.map((item, idx) => (
          <Card key={idx} style={s.rateCard}>
            <CardContent style={s.rateContent}>
              <View style={s.iconWrap}>
                <Ionicons name="trending-up" size={18} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.pairText}>{item.pair}</Text>
                <Text style={s.rateVal}>{item.rate}</Text>
              </View>
              <Badge variant={item.isPositive ? 'success' : 'neutral'} size="sm">
                {item.change}
              </Badge>
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
    rateCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    rateContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pairText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    rateVal: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
  });
}
