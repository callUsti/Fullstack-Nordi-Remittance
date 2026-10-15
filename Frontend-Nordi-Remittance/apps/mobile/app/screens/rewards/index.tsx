// ============================================================================
// REWARDS HUB — Points balance, categories & quick navigation
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

export default function RewardsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const sections = [
    { icon: 'star-outline', label: 'My Rewards', desc: 'View your points & rewards history', route: '/screens/rewards/MyRewards', color: '#f59e0b' },
    { icon: 'gift-outline', label: 'Redeem Points', desc: 'Exchange points for cash or vouchers', route: '/screens/rewards/RedeemPoints', color: '#6366f1' },
    { icon: 'pricetag-outline', label: 'Partner Discounts', desc: 'Exclusive deals from our partners', route: '/screens/rewards/PartnerDiscounts', color: '#10b981' },
    { icon: 'sparkles-outline', label: 'Special Offers', desc: 'Limited-time promotions & bonuses', route: '/screens/rewards/SpecialOffers', color: '#ec4899' },
  ];

  return (
    <View style={s.container}>
      <ScreenHeader title="Rewards & Offers" subtitle="Earn points on every transaction" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Points Balance Card */}
        <Card style={s.balanceCard}>
          <CardContent style={s.balanceContent}>
            <View style={s.balanceLeft}>
              <Text style={s.balanceLabel}>Total Points</Text>
              <Text style={s.balanceValue}>12,450</Text>
              <Text style={s.balanceEquiv}>≈ $124.50 value</Text>
            </View>
            <View style={s.tierBadge}>
              <Ionicons name="trophy-outline" size={28} color="#f59e0b" />
              <Text style={s.tierLabel}>Gold Tier</Text>
            </View>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Earned (MTD)', value: '1,240 pts' },
            { label: 'Redeemed', value: '3,600 pts' },
            { label: 'Expiring', value: '500 pts' },
          ].map((stat) => (
            <Card key={stat.label} style={s.statCard}>
              <CardContent style={s.statContent}>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Navigation */}
        {sections.map((sec) => (
          <TouchableOpacity
            key={sec.route}
            style={s.sectionBtn}
            onPress={() => router.push(sec.route as any)}
            activeOpacity={0.7}
          >
            <View style={[s.sectionIcon, { backgroundColor: `${sec.color}20` }]}>
              <Ionicons name={sec.icon as any} size={22} color={sec.color} />
            </View>
            <View style={s.sectionText}>
              <Text style={s.sectionLabel}>{sec.label}</Text>
              <Text style={s.sectionDesc}>{sec.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    balanceCard: {
      backgroundColor: '#1a1035',
      borderRadius: 20,
      marginBottom: 16,
      borderWidth: 0,
    },
    balanceContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    balanceLeft: { gap: 4 },
    balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
    balanceValue: { fontSize: 36, fontWeight: '800', color: '#fff' },
    balanceEquiv: { fontSize: 12, color: '#f59e0b' },
    tierBadge: { alignItems: 'center', gap: 4 },
    tierLabel: { fontSize: 12, fontWeight: '700', color: '#f59e0b' },
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statContent: { padding: 12, alignItems: 'center' },
    statValue: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },
    statLabel: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2, textAlign: 'center' },
    sectionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 14,
      marginBottom: 10,
      gap: 12,
    },
    sectionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    sectionText: { flex: 1 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
    sectionDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  });
}
