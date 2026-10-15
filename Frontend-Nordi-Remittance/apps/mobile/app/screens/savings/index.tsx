// ============================================================================
// SAVINGS HUB — Goals overview, analytics, auto-save & create goal
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
import { Button } from '@/components/ui/Button';
import { QuerySection } from '@/components/shared/QuerySection';
import { useClientSavingsGoals } from '@nordi/shared/client-usecase';

export default function SavingsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const goalsQuery = useClientSavingsGoals();
  const goals = ((goalsQuery as any).goals ?? (goalsQuery as any).data ?? []) as any[];

  const totalSaved = goals.reduce((sum: number, g: any) => sum + (Number(g.currentAmount) || 0), 0);
  const totalTarget = goals.reduce((sum: number, g: any) => sum + (Number(g.targetAmount) || 0), 0);

  const navItems = [
    { icon: 'flag-outline', label: 'Savings Goals', desc: 'Track your saving targets', route: '/screens/savings/SavingsGoalsList', color: '#6366f1' },
    { icon: 'stats-chart-outline', label: 'Analytics', desc: 'Savings trends & progress', route: '/screens/savings/SavingsAnalytics', color: '#10b981' },
    { icon: 'repeat-outline', label: 'Auto-Save Rules', desc: 'Automate your savings', route: '/screens/savings/AutoSaveRules', color: '#f59e0b' },
  ];

  return (
    <View style={s.container}>
      <ScreenHeader title="Savings" subtitle="Grow your wealth with smart goals" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Summary Card */}
        <Card style={s.summaryCard}>
          <CardContent style={s.summaryContent}>
            <View style={s.summaryLeft}>
              <Text style={s.summaryLabel}>Total Saved</Text>
              <Text style={s.summaryValue}>
                ${totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={s.summaryTarget}>
                of ${totalTarget.toLocaleString('en-US', { minimumFractionDigits: 2 })} target
              </Text>
            </View>
            <View style={s.summaryRight}>
              <Text style={s.goalsCount}>{goals.length}</Text>
              <Text style={s.goalsLabel}>Active Goals</Text>
            </View>
          </CardContent>
        </Card>

        <Button
          variant="primary"
          onPress={() => router.push('/screens/savings/CreateGoal' as any)}
          style={s.createBtn}
        >
          + Create New Goal
        </Button>

        {/* Navigation */}
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={s.navItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={[s.navIcon, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={s.navText}>
              <Text style={s.navLabel}>{item.label}</Text>
              <Text style={s.navDesc}>{item.desc}</Text>
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
    summaryCard: {
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      marginBottom: 14,
      borderWidth: 0,
    },
    summaryContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    summaryLeft: { gap: 4 },
    summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    summaryValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
    summaryTarget: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
    summaryRight: { alignItems: 'center' },
    goalsCount: { fontSize: 32, fontWeight: '800', color: '#fff' },
    goalsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
    createBtn: { marginBottom: 16 },
    navItem: {
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
    navIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    navText: { flex: 1 },
    navLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
    navDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  });
}
