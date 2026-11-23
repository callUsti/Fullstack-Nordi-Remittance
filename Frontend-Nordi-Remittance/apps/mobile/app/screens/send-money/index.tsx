// ============================================================================
// SEND & REMITTANCE HUB — Unified Money Movement Gateway
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { SPACING, FONT_SIZES, ICON_SIZES, RADIUS } from '@/constants/sizings';

const TRANSFER_METHODS = [
  {
    title: 'International Wire Transfer',
    sub: 'SEPA, SWIFT & local ACH rails across 120+ countries',
    route: '/screens/send-money/InternationalTransfer',
    icon: 'Globe',
    badge: 'Best FX',
    badgeVariant: 'success' as const,
  },
  {
    title: 'SwiftPay Instant P2P',
    sub: 'Zero fee instant transfer to any @nordi tag or email',
    route: '/screens/send-money/InstantPayment',
    icon: 'Zap',
    badge: 'Zero Fee',
    badgeVariant: 'primary' as const,
  },
  {
    title: 'Domestic Bank Transfer',
    sub: 'Faster Payments, NIBSS, Fedwire local routing',
    route: '/screens/send-money/DomesticTransfer',
    icon: 'Home',
    badge: 'Local',
    badgeVariant: 'outline' as const,
  },
  {
    title: 'Quick P2P Transfer',
    sub: 'Send to phone contacts and recent recipients',
    route: '/screens/send-money/QuickTransfer',
    icon: 'Users',
    badge: 'Instant',
    badgeVariant: 'outline' as const,
  },
  {
    title: 'Crypto & Digital Assets',
    sub: 'On-chain multi-network transfer (USDT, BTC, ETH, SOL)',
    route: '/screens/send-money/CryptoTransfer',
    icon: 'Coins',
    badge: 'Web3',
    badgeVariant: 'warning' as const,
  },
];

export default function SendMoneyHubScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  return (
    <AdaptiveScreen
      withTabBar={false}
      header={
        <ScreenHeader
          title="Send Money & Remittance"
          subtitle="Choose your preferred settlement method"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
      <Text style={s.sectionTitle}>TRANSFER METHODS</Text>

      {TRANSFER_METHODS.map((method, idx) => (
        <Card key={idx} style={s.methodCard}>
          <TouchableOpacity
            style={s.methodContent}
            onPress={() => router.push(method.route as any)}
            activeOpacity={0.7}
          >
            <View style={[s.iconWrap, { backgroundColor: theme.primarySoft }]}>
              <Icon name={method.icon} size={ICON_SIZES.sm} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={s.methodTitle}>{method.title}</Text>
                <Badge variant={method.badgeVariant} size="sm" style={{ marginLeft: 6 }}>
                  {method.badge}
                </Badge>
              </View>
              <Text style={s.methodSub}>{method.sub}</Text>
            </View>
            <Icon name="ChevronRight" size={ICON_SIZES.xs} color={theme.textMuted} />
          </TouchableOpacity>
        </Card>
      ))}
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    sectionTitle: {
      fontSize: FONT_SIZES.micro,
      fontWeight: '700',
      letterSpacing: 1,
      color: theme.textMuted,
      marginBottom: SPACING.xs,
      marginLeft: SPACING.xxs,
    },
    methodCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.xs,
    },
    methodContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.md,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    methodSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      lineHeight: 16,
    },
  });
}
