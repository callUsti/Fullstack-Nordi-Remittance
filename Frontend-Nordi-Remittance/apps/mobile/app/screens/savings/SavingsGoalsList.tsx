// ============================================================================
// SAVINGS GOALS LIST — View all active savings goals with progress
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
import { QuerySection } from '@/components/shared/QuerySection';
import { useClientSavingsGoals } from '@nordi/shared/client-usecase';
import { ICON_SIZES, SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';

const MOCK_GOALS = [
  { id: '1', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 6500, currency: 'USD', icon: '🛡️', deadline: 'Dec 2026', status: 'active' },
  { id: '2', name: 'Vacation — Paris', targetAmount: 5000, currentAmount: 2100, currency: 'USD', icon: '✈️', deadline: 'Jun 2027', status: 'active' },
  { id: '3', name: 'New MacBook', targetAmount: 2500, currentAmount: 2500, currency: 'USD', icon: '💻', deadline: 'Completed', status: 'completed' },
];

export default function SavingsGoalsListScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const goalsQuery = useClientSavingsGoals();
  const queryGoals = (goalsQuery as any).goals ?? (goalsQuery as any).data;
  const goals = (Array.isArray(queryGoals) && queryGoals.length ? queryGoals : MOCK_GOALS);

  return (
    <AdaptiveScreen
      onRefresh={() => { (goalsQuery as any)?.refetch?.(); }}
      refreshing={Boolean(goalsQuery.isLoading)}
      header={
        <ScreenHeader
          title="Savings Goals"
          subtitle="Track your saving targets"
          showBack
          onBackPress={() => router.back()}
          rightAction={
            <TouchableOpacity
              onPress={() => router.push('/screens/savings/CreateGoal' as any)}
              accessibilityLabel="Create Goal"
              activeOpacity={0.7}
            >
              <Icon name="PlusCircle" size={ICON_SIZES.lg} color={theme.primary} />
            </TouchableOpacity>
          }
        />
      }
    >
      <QuerySection query={goalsQuery} loadingRows={3}>
        {goals.map((goal: any) => {
          const progress = Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100);
          const isComplete = progress >= 100;
          return (
            <Card key={goal.id} style={s.card}>
              <CardContent style={s.cardContent}>
                <Text style={s.goalEmoji}>{goal.icon ?? '🎯'}</Text>
                <View style={s.goalInfo}>
                  <View style={s.goalHeader}>
                    <Text style={s.goalName}>{goal.name}</Text>
                    {isComplete && <Badge variant="success" size="sm">Complete</Badge>}
                  </View>
                  <View style={s.progressBar}>
                    <View
                      style={[
                        s.progressFill,
                        {
                          width: `${progress}%`,
                          backgroundColor: isComplete ? theme.success : theme.primary,
                        },
                      ]}
                    />
                  </View>
                  <View style={s.goalMeta}>
                    <Text style={s.goalAmount}>
                      ${Number(goal.currentAmount).toLocaleString()} / ${Number(goal.targetAmount).toLocaleString()}
                    </Text>
                    <Text style={s.goalProgress}>{Math.round(progress)}%</Text>
                  </View>
                  {goal.deadline && (
                    <Text style={s.goalDeadline}>🗓 {goal.deadline}</Text>
                  )}
                </View>
              </CardContent>
            </Card>
          );
        })}
      </QuerySection>
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: SPACING.md,
      gap: SPACING.md,
    },
    goalEmoji: {
      fontSize: 28,
      lineHeight: 34,
    },
    goalInfo: {
      flex: 1,
    },
    goalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    goalName: {
      flex: 1,
      fontSize: FONT_SIZES.subhead,
      fontWeight: '700',
      color: theme.text,
    },
    progressBar: {
      height: 6,
      borderRadius: RADIUS.xs,
      backgroundColor: theme.border,
      overflow: 'hidden',
      marginBottom: SPACING.xs,
    },
    progressFill: {
      height: '100%',
      borderRadius: RADIUS.xs,
    },
    goalMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    goalAmount: {
      fontSize: FONT_SIZES.bodySm,
      color: theme.textMuted,
    },
    goalProgress: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '700',
      color: theme.primary,
    },
    goalDeadline: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      marginTop: SPACING.xs,
    },
  });
}
