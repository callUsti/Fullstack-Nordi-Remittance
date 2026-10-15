// ============================================================================
// WALLET DETAILS SCREEN — IBAN, SWIFT/BIC, Bank Address, & Transaction Ledger
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function WalletDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const walletName = (params.name as string) || 'Primary USD Wallet';
  const currency = (params.currency as string) || 'USD';
  const balance = Number(params.balance || 24850.75);

  const bankDetails = [
    { label: 'Account Holder', value: 'Jane Doe Enterprise Ltd' },
    { label: 'IBAN / Account Number', value: 'GB29 NORD 6016 1331 9284 11' },
    { label: 'SWIFT / BIC Code', value: 'NORDGB2LXXX' },
    { label: 'Sort Code / Routing', value: '60-16-13' },
    { label: 'Bank Name', value: 'Nordi Remit Banking (UK) PLC' },
    { label: 'Bank Address', value: '25 Bank Street, Canary Wharf, London, UK' },
  ];

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title={walletName}
        subtitle="Domestic & International Wire Transfer Coordinates"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={s.balanceHero}>
          <CardContent style={s.heroContent}>
            <Text style={s.heroLabel}>Available Balance</Text>
            <Text style={s.heroAmount}>
              {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
              {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
            </Text>
            <View style={s.heroActionRow}>
              <Button
                title="Send Funds"
                variant="primary"
                size="sm"
                onPress={() => router.push('/screens/send-money' as any)}
                style={{ flex: 1 }}
              />
              <Button
                title="Convert"
                variant="outline"
                size="sm"
                onPress={() => router.push('/screens/forex' as any)}
                style={{ flex: 1 }}
              />
            </View>
          </CardContent>
        </Card>

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Wire & Deposit Details</Text>
          <Badge variant="success" size="sm">SEPA & SWIFT Enabled</Badge>
        </View>

        <Card style={s.detailsCard}>
          <CardContent style={s.detailsContent}>
            {bankDetails.map((item, idx) => (
              <View key={idx}>
                <View style={s.detailRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.detailLabel}>{item.label}</Text>
                    <Text style={s.detailValue}>{item.value}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(item.value, item.label)}
                    style={s.copyBtn}
                  >
                    <Ionicons name="copy-outline" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
                {idx < bankDetails.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </CardContent>
        </Card>
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    balanceHero: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    heroContent: {
      padding: 18,
    },
    heroLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    heroAmount: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    heroActionRow: {
      flexDirection: 'row',
      gap: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    detailsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    detailsContent: {
      padding: 16,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    detailLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginBottom: 3,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    copyBtn: {
      padding: 8,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 10,
    },
  });
}
