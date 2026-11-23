// ============================================================================
// SAVINGS HUB — Goals overview, analytics, auto-save & create goal
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
import { Button } from '@/components/ui/Button';
import { QuerySection } from '@/components/shared/QuerySection';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { Icon } from '@/components/ui/Icon';
import { ICON_SIZES, SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';
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
    { iconName: 'Flag' as const, label: 'Savings Goals', desc: 'Track your saving targets', route: '/screens/savings/SavingsGoalsList', color: '#6366f1' },
    { iconName: 'BarChart3' as const, label: 'Analytics', desc: 'Savings trends & progress', route: '/screens/savings/SavingsAnalytics', color: '#10b981' },
    { iconName: 'RefreshCw' as const, label: 'Auto-Save Rules', desc: 'Automate your savings', route: '/screens/savings/AutoSaveRules', color: '#f59e0b' },
  ];

  return (
    <AdaptiveScreen
      header={
        <ScreenHeader title="Savings" subtitle="Grow your wealth with smart goals" />
      }
    >
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
            <Icon name={item.iconName} size={ICON_SIZES.lg} color={item.color} />
          </View>
          <View style={s.navText}>
            <Text style={s.navLabel}>{item.label}</Text>
            <Text style={s.navDesc}>{item.desc}</Text>
          </View>
          <Icon name="ChevronRight" size={ICON_SIZES.sm} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    summaryCard: {
      backgroundColor: theme.colors.primary,
      borderRadius: RADIUS['2xl'],
      marginBottom: SPACING.md,
      borderWidth: 0,
    },
    summaryContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl },
    summaryLeft: { gap: SPACING.xs },
    summaryLabel: { fontSize: FONT_SIZES.bodySm, color: 'rgba(255,255,255,0.7)' },
    summaryValue: { fontSize: FONT_SIZES.display, fontWeight: '800', color: '#fff' },
    summaryTarget: { fontSize: FONT_SIZES.caption, color: 'rgba(255,255,255,0.6)' },
    summaryRight: { alignItems: 'center' },
    goalsCount: { fontSize: 32, fontWeight: '800', color: '#fff' },
    goalsLabel: { fontSize: FONT_SIZES.caption, color: 'rgba(255,255,255,0.7)' },
    createBtn: { marginBottom: SPACING.lg },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      gap: SPACING.md,
    },
    navIcon: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
    navText: { flex: 1 },
    navLabel: { fontSize: FONT_SIZES.subhead, fontWeight: '600', color: theme.colors.textPrimary },
    navDesc: { fontSize: FONT_SIZES.caption, color: theme.colors.textSecondary, marginTop: SPACING.xxs },
  });
}
