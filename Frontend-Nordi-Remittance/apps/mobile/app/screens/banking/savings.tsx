// ============================================================================
// SAVINGS GOALS & VAULTS SCREEN — Target Progress, Auto-Save Rules, & Deposits
// Connected to useSavingsGoals, useInvestments, and luxury mobile tokens
// ============================================================================
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader, SubNavTabs } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QuerySection } from '@/components/shared/QuerySection';
import { useSavingsGoals } from '@nordi/shared/hooks/api-queries/useInvestments';

const SAVINGS_TABS = [
  { key: 'goals', label: 'My Vaults' },
  { key: 'create', label: 'Create Vault' },
  { key: 'rules', label: 'Auto-Save Rules' },
];

export default function SavingsGoalsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [activeTab, setActiveTab] = useState('goals');

  // Form State
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('5000');
  const [initialDeposit, setInitialDeposit] = useState('200');

  // Auto-Save Toggles
  const [roundUps, setRoundUps] = useState(true);
  const [salaryRule, setSalaryRule] = useState(true);
  const [weeklyDeposit, setWeeklyDeposit] = useState(false);

  const { data: savingsData, isLoading, isError, refetch } = useSavingsGoals();

  const goalsList = useMemo(() => {
    const list = Array.isArray(savingsData) ? savingsData : (savingsData as any)?.data || [];
    if (list.length > 0) return list;
    return [
      {
        id: '1',
        name: 'Emergency Reserve Vault',
        target: 10000,
        saved: 8500,
        currency: 'USD',
        yieldRate: 4.8,
        deadline: 'Dec 2026',
        category: 'emergency',
      },
      {
        id: '2',
        name: 'Summer Family Vacation',
        target: 5000,
        saved: 3200,
        currency: 'USD',
        yieldRate: 4.8,
        deadline: 'Jul 2027',
        category: 'travel',
      },
      {
        id: '3',
        name: 'Electric Vehicle Down Payment',
        target: 25000,
        saved: 12400,
        currency: 'USD',
        yieldRate: 4.8,
        deadline: 'Nov 2027',
        category: 'auto',
      },
    ];
  }, [savingsData]);

  const totalSaved = useMemo(() => {
    return goalsList.reduce((sum: number, g: any) => sum + (Number(g.saved) || 0), 0);
  }, [goalsList]);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Savings Vaults"
        subtitle="Automated wealth building and locked target vaults"
      />

      <SubNavTabs tabs={SAVINGS_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* GOALS TAB */}
        {activeTab === 'goals' && (
          <QuerySection isLoading={isLoading} isError={isError} onRetry={refetch}>
            {/* Total Stashed Card */}
            <Card variant="default" style={s.totalCard}>
              <CardContent style={s.totalCardInner}>
                <Text style={s.totalLabel}>Total Stashed in Vaults</Text>
                <Text style={s.totalAmount}>
                  ${totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
                <View style={s.totalMeta}>
                  <Badge variant="success">Earning 4.8% APY</Badge>
                  <Text style={s.totalMetaText}>Interest paid monthly</Text>
                </View>
              </CardContent>
            </Card>

            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Target Goals ({goalsList.length})</Text>
            </View>

            <View style={s.goalsList}>
              {goalsList.map((goal: any) => {
                const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
                return (
                  <Card key={goal.id} variant="default" style={s.goalCard}>
                    <CardContent style={s.goalCardInner}>
                      <View style={s.goalTop}>
                        <View style={s.iconBox}>
                          <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.goalName}>{goal.name}</Text>
                          <Text style={s.goalDeadline}>Target date: {goal.deadline || 'Flexible'}</Text>
                        </View>
                        <Badge variant={pct >= 80 ? 'success' : 'info'}>{pct}%</Badge>
                      </View>

                      <View style={s.amountRow}>
                        <Text style={s.savedAmount}>${Number(goal.saved).toLocaleString()}</Text>
                        <Text style={s.targetAmount}>of ${Number(goal.target).toLocaleString()} USD</Text>
                      </View>

                      <View style={s.trackBar}>
                        <View style={[s.fillBar, { width: `${pct}%`, backgroundColor: theme.primary }]} />
                      </View>

                      <View style={s.btnActionRow}>
                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                          onPress={() => {
                            Alert.alert('Deposit to Vault', `Enter deposit amount for ${goal.name}.`);
                          }}
                        >
                          + Add Funds to Vault
                        </Button>
                      </View>
                    </CardContent>
                  </Card>
                );
              })}
            </View>
          </QuerySection>
        )}

        {/* CREATE GOAL TAB */}
        {activeTab === 'create' && (
          <View style={s.tabSection}>
            <Text style={s.sectionTitle}>Create a New Savings Goal</Text>
            <Text style={s.sectionSub}>Lock funds into high-yield vaults with automated contribution schedules.</Text>

            <Card variant="default" style={s.formCard}>
              <CardContent style={s.formCardInner}>
                <View style={s.formGroup}>
                  <Text style={s.fieldLabel}>Goal Name</Text>
                  <TextInput
                    style={s.formInput}
                    placeholder="e.g. Dream House Down Payment"
                    placeholderTextColor={theme.textMuted}
                    value={goalName}
                    onChangeText={setGoalName}
                  />
                </View>

                <View style={s.formGroup}>
                  <Text style={s.fieldLabel}>Target Amount (USD)</Text>
                  <TextInput
                    style={s.formInput}
                    placeholder="5000"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                  />
                </View>

                <View style={s.formGroup}>
                  <Text style={s.fieldLabel}>Initial Deposit from Primary Wallet (USD)</Text>
                  <TextInput
                    style={s.formInput}
                    placeholder="200"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    value={initialDeposit}
                    onChangeText={setInitialDeposit}
                  />
                </View>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={() => {
                    Alert.alert('Vault Created!', `Your new vault "${goalName || 'My Goal'}" has been created.`);
                    setActiveTab('goals');
                  }}
                >
                  Create Savings Vault
                </Button>
              </CardContent>
            </Card>
          </View>
        )}

        {/* AUTO-SAVE RULES TAB */}
        {activeTab === 'rules' && (
          <View style={s.tabSection}>
            <Text style={s.sectionTitle}>Smart Auto-Save Automation</Text>
            <Text style={s.sectionSub}>Automate microsavings effortlessly whenever you transact.</Text>

            <Card variant="default" style={s.formCard}>
              <CardContent style={s.formCardInner}>
                <View style={s.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.switchTitle}>Spare Change Round-Ups</Text>
                    <Text style={s.switchSub}>Round every card swipe up to the nearest dollar and stash the difference.</Text>
                  </View>
                  <Switch value={roundUps} onValueChange={setRoundUps} />
                </View>

                <View style={s.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.switchTitle}>10% Payday Auto-Split</Text>
                    <Text style={s.switchSub}>Automatically transfer 10% of payroll deposits directly into your Emergency Vault.</Text>
                  </View>
                  <Switch value={salaryRule} onValueChange={setSalaryRule} />
                </View>

                <View style={s.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.switchTitle}>Weekly $50 Transfer</Text>
                    <Text style={s.switchSub}>Automated recurring deposit scheduled every Monday morning.</Text>
                  </View>
                  <Switch value={weeklyDeposit} onValueChange={setWeeklyDeposit} />
                </View>
              </CardContent>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    totalCard: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 10,
    },
    totalCardInner: {
      padding: 16,
    },
    totalLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    totalAmount: {
      fontSize: 30,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -1,
      marginVertical: 4,
    },
    totalMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    totalMetaText: {
      fontSize: 11,
      color: theme.textMuted,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      marginTop: 6,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.2,
    },
    sectionSub: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
      marginBottom: 12,
    },
    goalsList: {
      paddingHorizontal: 16,
      gap: 10,
    },
    goalCard: {
      marginBottom: 2,
    },
    goalCardInner: {
      padding: 14,
      gap: 10,
    },
    goalTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalName: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    goalDeadline: {
      fontSize: 10,
      color: theme.textMuted,
      marginTop: 1,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    savedAmount: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    targetAmount: {
      fontSize: 11,
      color: theme.textMuted,
    },
    trackBar: {
      height: 6,
      backgroundColor: theme.surfaceAlt,
      borderRadius: 3,
      overflow: 'hidden',
    },
    fillBar: {
      height: '100%',
      borderRadius: 3,
    },
    btnActionRow: {
      marginTop: 2,
    },
    tabSection: {
      padding: 16,
    },
    formCard: {
      marginBottom: 10,
    },
    formCardInner: {
      padding: 16,
      gap: 14,
    },
    formGroup: {
      gap: 6,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    formInput: {
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: theme.text,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    switchTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    switchSub: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
  });
