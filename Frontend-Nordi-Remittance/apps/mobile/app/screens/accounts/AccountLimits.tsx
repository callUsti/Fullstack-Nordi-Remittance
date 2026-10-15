// ============================================================================
// ACCOUNT LIMITS SCREEN — Tier limits, Daily Caps, & Velocity Controls
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
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function AccountLimitsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const limits = [
    {
      title: 'Daily Outgoing Transfer Limit',
      used: 3450,
      max: 25000,
      currency: 'USD',
      icon: 'arrow-up-circle',
    },
    {
      title: 'Monthly Remittance Cap',
      used: 18200,
      max: 100000,
      currency: 'USD',
      icon: 'calendar',
    },
    {
      title: 'ATM Cash Withdrawal',
      used: 400,
      max: 2500,
      currency: 'USD',
      icon: 'cash',
    },
    {
      title: 'Crypto Instant Swap Limit',
      used: 1200,
      max: 10000,
      currency: 'USD',
      icon: 'logo-bitcoin',
    },
  ];

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Account & Transfer Limits"
        subtitle="Tier 2 Verified • Compliance regulated limits"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={s.tierCard}>
          <CardContent style={s.tierContent}>
            <View style={s.tierHeader}>
              <View>
                <Text style={s.tierTitle}>Tier 2 Standard Business</Text>
                <Text style={s.tierSub}>KYC Verified & Identity Verified</Text>
              </View>
              <Badge variant="success" size="sm">Active Tier</Badge>
            </View>
            <Text style={s.tierDesc}>
              Need higher limits for corporate transactions or large property purchases? Complete Tier 3 Enhanced Diligence.
            </Text>
            <Button
              title="Request Limit Upgrade (Tier 3)"
              variant="outline"
              size="sm"
              onPress={() => router.push('/screens/security/KYCVerification' as any)}
              style={{ marginTop: 12 }}
            />
          </CardContent>
        </Card>

        <Text style={s.sectionTitle}>Velocity Breakdown</Text>

        {limits.map((item, idx) => {
          const pct = Math.min(Math.round((item.used / item.max) * 100), 100);
          return (
            <Card key={idx} style={s.limitCard}>
              <CardContent style={s.limitContent}>
                <View style={s.limitHeader}>
                  <View style={s.iconWrap}>
                    <Ionicons name={item.icon as any} size={18} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={s.itemTitle}>{item.title}</Text>
                    <Text style={s.itemMeta}>
                      ${item.used.toLocaleString()} of ${item.max.toLocaleString()} {item.currency}
                    </Text>
                  </View>
                  <Text style={s.pctText}>{pct}%</Text>
                </View>

                <View style={s.progressBarTrack}>
                  <View
                    style={[
                      s.progressBarFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: pct > 80 ? theme.colors.warning : theme.colors.primary,
                      },
                    ]}
                  />
                </View>
              </CardContent>
            </Card>
          );
        })}
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
    tierCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    tierContent: {
      padding: 16,
    },
    tierHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    tierTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    tierSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    tierDesc: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 10,
    },
    limitCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    limitContent: {
      padding: 14,
    },
    limitHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: `${theme.colors.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    itemMeta: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    pctText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    progressBarTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
  });
}
