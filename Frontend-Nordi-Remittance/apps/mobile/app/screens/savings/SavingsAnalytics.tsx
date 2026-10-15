// ============================================================================
// SAVINGS ANALYTICS — Trends, contributions, and goal performance charts
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

const MONTHLY = [
  { month: 'Jul', amount: 800 },
  { month: 'Aug', amount: 1200 },
  { month: 'Sep', amount: 950 },
  { month: 'Oct', amount: 1400 },
];

const MAX_BAR = 1400;

export default function SavingsAnalyticsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const totalContributed = MONTHLY.reduce((s, m) => s + m.amount, 0);
  const avgMonthly = Math.round(totalContributed / MONTHLY.length);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Savings Analytics"
        subtitle="Understand your savings patterns"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* KPI Row */}
        <View style={s.kpiRow}>
          {[
            { label: 'Total Saved', value: `$${totalContributed.toLocaleString()}` },
            { label: 'Avg / Month', value: `$${avgMonthly.toLocaleString()}` },
            { label: 'Active Goals', value: '3' },
          ].map((kpi) => (
            <Card key={kpi.label} style={s.kpiCard}>
              <CardContent style={s.kpiContent}>
                <Text style={s.kpiValue}>{kpi.value}</Text>
                <Text style={s.kpiLabel}>{kpi.label}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Bar Chart */}
        <Card style={s.chartCard}>
          <CardContent style={s.chartContent}>
            <Text style={s.chartTitle}>Monthly Contributions</Text>
            <View style={s.barChart}>
              {MONTHLY.map((m) => (
                <View key={m.month} style={s.barItem}>
                  <Text style={s.barValue}>${m.amount}</Text>
                  <View style={s.barTrack}>
                    <View
                      style={[
                        s.barFill,
                        { height: `${Math.round((m.amount / MAX_BAR) * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={s.barMonth}>{m.month}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Goal Breakdown */}
        <Text style={s.sectionLabel}>Goal Breakdown</Text>
        {[
          { name: 'Emergency Fund', progress: 65, color: '#6366f1' },
          { name: 'Paris Vacation', progress: 42, color: '#10b981' },
          { name: 'MacBook Pro', progress: 100, color: '#f59e0b' },
        ].map((goal) => (
          <Card key={goal.name} style={s.goalCard}>
            <CardContent style={s.goalContent}>
              <View style={s.goalHeader}>
                <Text style={s.goalName}>{goal.name}</Text>
                {goal.progress >= 100 ? (
                  <Badge variant="success" size="sm">Complete</Badge>
                ) : (
                  <Text style={s.goalPct}>{goal.progress}%</Text>
                )}
              </View>
              <View style={s.progressBar}>
                <View
                  style={[
                    s.progressFill,
                    { width: `${goal.progress}%`, backgroundColor: goal.color },
                  ]}
                />
              </View>
            </CardContent>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    kpiCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    kpiContent: { padding: 12, alignItems: 'center' },
    kpiValue: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary },
    kpiLabel: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2, textAlign: 'center' },
    chartCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    chartContent: { padding: 16 },
    chartTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 16 },
    barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 12 },
    barItem: { flex: 1, alignItems: 'center', gap: 4 },
    barValue: { fontSize: 9, color: theme.colors.textSecondary },
    barTrack: { flex: 1, width: '100%', backgroundColor: theme.colors.border, borderRadius: 4, justifyContent: 'flex-end' },
    barFill: { width: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
    barMonth: { fontSize: 11, color: theme.colors.textSecondary },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    goalCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    goalContent: { padding: 14 },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    goalName: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary },
    goalPct: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
    progressBar: { height: 6, borderRadius: 3, backgroundColor: theme.colors.border, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
  });
}
