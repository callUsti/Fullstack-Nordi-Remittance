// ============================================================================
// MY REWARDS — Points history, tier progress & earned rewards
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

const HISTORY = [
  { id: '1', action: 'International Transfer', points: '+250 pts', date: 'Today', type: 'earn' },
  { id: '2', action: 'Reward Redemption', points: '-500 pts', date: 'Yesterday', type: 'redeem' },
  { id: '3', action: 'Currency Exchange', points: '+120 pts', date: '2 days ago', type: 'earn' },
  { id: '4', action: 'Bill Payment Bonus', points: '+75 pts', date: '5 days ago', type: 'earn' },
  { id: '5', action: 'Monthly Bonus', points: '+1,000 pts', date: '1 week ago', type: 'bonus' },
];

export default function MyRewardsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const progress = 12450 / 25000;

  return (
    <View style={s.container}>
      <ScreenHeader
        title="My Rewards"
        subtitle="Your points & tier progress"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Tier Progress */}
        <Card style={s.tierCard}>
          <CardContent style={s.tierContent}>
            <View style={s.tierHeader}>
              <View>
                <Text style={s.tierCurrent}>Gold Tier</Text>
                <Text style={s.tierSub}>12,450 of 25,000 pts for Platinum</Text>
              </View>
              <Ionicons name="trophy" size={28} color="#f59e0b" />
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={s.progressText}>{Math.round(progress * 100)}% to Platinum</Text>
          </CardContent>
        </Card>

        {/* Points History */}
        <Text style={s.sectionLabel}>Points History</Text>
        <Card style={s.historyCard}>
          <CardContent style={s.historyContent}>
            {HISTORY.map((item, idx) => (
              <View key={item.id} style={[s.historyRow, idx < HISTORY.length - 1 && s.historyBorder]}>
                <View style={[s.historyDot, item.type === 'redeem' && s.historyDotRedeem, item.type === 'bonus' && s.historyDotBonus]} />
                <View style={s.historyText}>
                  <Text style={s.historyAction}>{item.action}</Text>
                  <Text style={s.historyDate}>{item.date}</Text>
                </View>
                <Text style={[
                  s.historyPoints,
                  item.type === 'redeem' && s.historyPointsRedeem,
                  item.type === 'bonus' && s.historyPointsBonus,
                ]}>
                  {item.points}
                </Text>
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
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    tierCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    tierContent: { padding: 16 },
    tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    tierCurrent: { fontSize: 16, fontWeight: '800', color: '#f59e0b' },
    tierSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    progressBar: { height: 8, borderRadius: 4, backgroundColor: theme.colors.border, overflow: 'hidden', marginBottom: 6 },
    progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#f59e0b' },
    progressText: { fontSize: 11, color: theme.colors.textSecondary },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    historyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    historyContent: { padding: 4 },
    historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 10 },
    historyBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    historyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.success },
    historyDotRedeem: { backgroundColor: '#ef4444' },
    historyDotBonus: { backgroundColor: '#f59e0b' },
    historyText: { flex: 1 },
    historyAction: { fontSize: 13, fontWeight: '500', color: theme.colors.textPrimary },
    historyDate: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    historyPoints: { fontSize: 13, fontWeight: '700', color: theme.colors.success },
    historyPointsRedeem: { color: '#ef4444' },
    historyPointsBonus: { color: '#f59e0b' },
  });
}
