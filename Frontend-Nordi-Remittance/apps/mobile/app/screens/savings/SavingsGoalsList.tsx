// ============================================================================
// SAVINGS GOALS LIST — View all active savings goals with progress
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
import { QuerySection } from '@/components/shared/QuerySection';
import { useClientSavingsGoals } from '@nordi/shared/client-usecase';

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
    <View style={s.container}>
      <ScreenHeader
        title="Savings Goals"
        subtitle="Track your saving targets"
        showBack
        onBackPress={() => router.back()}
        rightAction={
          <TouchableOpacity onPress={() => router.push('/screens/savings/CreateGoal' as any)}>
            <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
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
                      <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: isComplete ? theme.colors.success : theme.colors.primary }]} />
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
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    cardContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
    goalEmoji: { fontSize: 28, lineHeight: 34 },
    goalInfo: { flex: 1 },
    goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    goalName: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
    progressBar: { height: 6, borderRadius: 3, backgroundColor: theme.colors.border, overflow: 'hidden', marginBottom: 6 },
    progressFill: { height: '100%', borderRadius: 3 },
    goalMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goalAmount: { fontSize: 12, color: theme.colors.textSecondary },
    goalProgress: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
    goalDeadline: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4 },
  });
}
