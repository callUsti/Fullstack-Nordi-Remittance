// ============================================================================
// SEND & REMITTANCE HUB — Unified Money Movement Gateway
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const TRANSFER_METHODS = [
  {
    title: 'International Wire Transfer',
    sub: 'SEPA, SWIFT & local ACH rails across 120+ countries',
    route: '/screens/send-money/InternationalTransfer',
    icon: 'globe-outline',
    badge: 'Best FX',
    badgeVariant: 'success' as const,
  },
  {
    title: 'SwiftPay Instant P2P',
    sub: 'Zero fee instant transfer to any @nordi tag or email',
    route: '/screens/send-money/InstantPayment',
    icon: 'flash-outline',
    badge: 'Zero Fee',
    badgeVariant: 'primary' as const,
  },
  {
    title: 'Domestic Bank Transfer',
    sub: 'Faster Payments, NIBSS, Fedwire local routing',
    route: '/screens/send-money/DomesticTransfer',
    icon: 'home-outline',
    badge: 'Local',
    badgeVariant: 'neutral' as const,
  },
  {
    title: 'Quick P2P Transfer',
    sub: 'Send to phone contacts and recent recipients',
    route: '/screens/send-money/QuickTransfer',
    icon: 'people-outline',
    badge: 'Instant',
    badgeVariant: 'neutral' as const,
  },
  {
    title: 'Crypto & Digital Assets',
    sub: 'On-chain multi-network transfer (USDT, BTC, ETH, SOL)',
    route: '/screens/send-money/CryptoTransfer',
    icon: 'logo-bitcoin',
    badge: 'Web3',
    badgeVariant: 'warning' as const,
  },
];

export default function SendMoneyHubScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Send Money & Remittance"
        subtitle="Choose your preferred settlement method"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Text style={s.sectionTitle}>Transfer Methods</Text>

        {TRANSFER_METHODS.map((method, idx) => (
          <Card key={idx} style={s.methodCard}>
            <TouchableOpacity
              style={s.methodContent}
              onPress={() => router.push(method.route as any)}
            >
              <View style={s.iconWrap}>
                <Ionicons name={method.icon as any} size={22} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={s.methodTitle}>{method.title}</Text>
                  <Badge variant={method.badgeVariant} size="sm" style={{ marginLeft: 8 }}>
                    {method.badge}
                  </Badge>
                </View>
                <Text style={s.methodSub}>{method.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
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
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    methodCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    methodContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: `${theme.colors.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    methodSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
      lineHeight: 16,
    },
  });
}
