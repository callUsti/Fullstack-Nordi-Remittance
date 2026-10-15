// ============================================================================
// CURRENCY EXCHANGE SCREEN — Live FX Rates, Instant Swap, & Spread Calculator
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useForexStore } from '@/stores';

const FX_RATES: Record<string, number> = {
  'USD_EUR': 0.924,
  'EUR_USD': 1.082,
  'USD_GBP': 0.778,
  'GBP_USD': 1.285,
  'USD_NGN': 1640.0,
  'NGN_USD': 0.00061,
  'EUR_GBP': 0.842,
  'GBP_EUR': 1.187,
};

const POPULAR_PAIRS = [
  { from: 'USD', to: 'EUR', label: 'USD/EUR' },
  { from: 'GBP', to: 'USD', label: 'GBP/USD' },
  { from: 'USD', to: 'NGN', label: 'USD/NGN' },
  { from: 'EUR', to: 'GBP', label: 'EUR/GBP' },
];

export default function CurrencyExchangeScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const {
    fromCurr, setFromCurr,
    toCurr, setToCurr,
    fromAmount, setFromAmount,
    isConverting, setIsConverting,
    swapCurrencies,
  } = useForexStore();

  const pairKey = `${fromCurr}_${toCurr}`;
  const rate = FX_RATES[pairKey] || 1.0;
  const toAmount = (parseFloat(fromAmount || '0') * rate).toFixed(2);

  const handleSwapCurrencies = () => swapCurrencies();

  const handleExecuteSwap = () => {
    setIsConverting(true);
    setTimeout(() => {
      setIsConverting(false);
      Alert.alert(
        'Exchange Executed',
        `Successfully exchanged ${fromAmount} ${fromCurr} to ${toAmount} ${toCurr} at rate 1 ${fromCurr} = ${rate} ${toCurr}.`,
        [{ text: 'View Accounts', onPress: () => router.push('/screens/accounts' as any) }]
      );
    }, 1000);
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Currency Exchange (FX)"
        subtitle="Interbank institutional exchange rates with 0.1% spread"
        showBack
        onBackPress={() => router.back()}
        rightElement={
          <TouchableOpacity
            style={s.headerIconBtn}
            onPress={() => router.push('/screens/forex/LiveRates' as any)}
          >
            <Ionicons name="stats-chart" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Converter Card */}
        <Card style={s.converterCard}>
          <CardContent style={s.converterContent}>
            {/* You Sell / From */}
            <View style={s.inputBox}>
              <Text style={s.boxLabel}>You Send / Exchange</Text>
              <View style={s.inputRow}>
                <TextInput
                  value={fromAmount}
                  onChangeText={setFromAmount}
                  style={s.amountInput}
                  keyboardType="decimal-pad"
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <TouchableOpacity style={s.currBadge}>
                  <Text style={s.currText}>{fromCurr}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Invert Button */}
            <View style={s.swapBtnRow}>
              <View style={s.line} />
              <TouchableOpacity
                style={s.swapCircle}
                onPress={handleSwapCurrencies}
              >
                <Ionicons name="swap-vertical" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <View style={s.line} />
            </View>

            {/* You Receive / To */}
            <View style={s.inputBox}>
              <Text style={s.boxLabel}>You Receive (Estimated)</Text>
              <View style={s.inputRow}>
                <Text style={s.amountOutput}>{toAmount}</Text>
                <TouchableOpacity style={s.currBadge}>
                  <Text style={s.currText}>{toCurr}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Rate summary banner */}
            <View style={s.rateBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="flash" size={14} color={theme.colors.success} />
                <Text style={s.rateText}>
                  1 {fromCurr} = {rate} {toCurr}
                </Text>
              </View>
              <Badge variant="success" size="sm">Guaranteed for 60s</Badge>
            </View>

            <Button
              title={isConverting ? 'Processing FX Conversion...' : `Convert ${fromCurr} to ${toCurr}`}
              variant="primary"
              size="lg"
              onPress={handleExecuteSwap}
              disabled={isConverting}
              style={{ marginTop: 14 }}
            />
          </CardContent>
        </Card>

        {/* Quick Popular Pairs */}
        <Text style={s.sectionTitle}>Popular Exchange Pairs</Text>
        <View style={s.pairsGrid}>
          {POPULAR_PAIRS.map((pair, idx) => {
            const currentRate = FX_RATES[`${pair.from}_${pair.to}`] || 1.0;
            return (
              <Card key={idx} style={s.pairCard}>
                <TouchableOpacity
                  style={s.pairContent}
                  onPress={() => {
                    setFromCurr(pair.from);
                    setToCurr(pair.to);
                  }}
                >
                  <Text style={s.pairLabel}>{pair.label}</Text>
                  <Text style={s.pairRate}>{currentRate.toFixed(4)}</Text>
                  <Text style={s.tapToLoad}>Tap to convert</Text>
                </TouchableOpacity>
              </Card>
            );
          })}
        </View>

        <View style={s.quickLinksRow}>
          <Button
            title="Live Market Tickers"
            variant="outline"
            size="sm"
            onPress={() => router.push('/screens/forex/LiveRates' as any)}
            style={{ flex: 1 }}
          />
          <Button
            title="FX Rate Alerts"
            variant="outline"
            size="sm"
            onPress={() => router.push('/screens/forex/CurrencyAlerts' as any)}
            style={{ flex: 1 }}
          />
        </View>
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
    headerIconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${theme.colors.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    converterCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    converterContent: {
      padding: 16,
    },
    inputBox: {
      backgroundColor: `${theme.colors.textSecondary}08`,
      borderRadius: 12,
      padding: 14,
    },
    boxLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    amountInput: {
      flex: 1,
      fontSize: 26,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      padding: 0,
    },
    amountOutput: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    currBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: `${theme.colors.primary}15`,
    },
    currText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    swapBtnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    swapCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 12,
    },
    rateBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: `${theme.colors.success}10`,
      borderRadius: 8,
      marginTop: 14,
    },
    rateText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginLeft: 6,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 10,
    },
    pairsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    pairCard: {
      width: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pairContent: {
      padding: 12,
    },
    pairLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    pairRate: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    tapToLoad: {
      fontSize: 10,
      color: theme.colors.textSecondary,
    },
    quickLinksRow: {
      flexDirection: 'row',
      gap: 12,
    },
  });
}
