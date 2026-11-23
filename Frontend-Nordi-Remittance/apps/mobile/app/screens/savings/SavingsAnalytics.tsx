// ============================================================================
// SAVINGS ANALYTICS — Trends, contributions, and goal performance charts
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';

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
    <AdaptiveScreen
      header={
        <ScreenHeader
          title="Savings Analytics"
          subtitle="Understand your savings patterns"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
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
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    kpiRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
    kpiCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    kpiContent: { padding: SPACING.md, alignItems: 'center' },
    kpiValue: { fontSize: FONT_SIZES.titleSm, fontWeight: '800', color: theme.colors.textPrimary },
    kpiLabel: { fontSize: FONT_SIZES.micro, color: theme.colors.textSecondary, marginTop: SPACING.xxs, textAlign: 'center' },
    chartCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: SPACING.lg,
    },
    chartContent: { padding: SPACING.lg },
    chartTitle: { fontSize: FONT_SIZES.subhead, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: SPACING.lg },
    barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: SPACING.md },
    barItem: { flex: 1, alignItems: 'center', gap: SPACING.xs },
    barValue: { fontSize: FONT_SIZES.nano, color: theme.colors.textSecondary },
    barTrack: { flex: 1, width: '100%', backgroundColor: theme.colors.border, borderRadius: RADIUS.xs, justifyContent: 'flex-end' },
    barFill: { width: '100%', backgroundColor: theme.colors.primary, borderRadius: RADIUS.xs },
    barMonth: { fontSize: FONT_SIZES.caption, color: theme.colors.textSecondary },
    sectionLabel: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: SPACING.sm,
    },
    goalCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: SPACING.sm,
    },
    goalContent: { padding: SPACING.md },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
    goalName: { fontSize: FONT_SIZES.body, fontWeight: '600', color: theme.colors.textPrimary },
    goalPct: { fontSize: FONT_SIZES.bodySm, fontWeight: '700', color: theme.colors.primary },
    progressBar: { height: 6, borderRadius: 3, backgroundColor: theme.colors.border, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
  });
}
