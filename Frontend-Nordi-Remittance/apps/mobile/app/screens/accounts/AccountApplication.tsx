// ============================================================================
// ACCOUNT APPLICATION SCREEN — Apply for Regulated Savings, Current & Fixed Deposit
// Connected to useClientAccountApplications, useApplyForAccount, useCancelApplication
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import {
  useClientAccountApplications,
  useApplyForAccount,
  useCancelApplication,
} from '@nordi/shared/client-usecase';
import {
  FIXED_DEPOSIT_RATES,
  SAVINGS_INTEREST_RATE,
} from '@nordi/shared/domain/types/Accounts.types';
import { ICON_SIZES, SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';

type ApplicationType = 'savings' | 'current' | 'fixed_deposit';

export default function AccountApplicationScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [activeTab, setActiveTab] = useState<'apply' | 'history'>('apply');
  const [selectedType, setSelectedType] = useState<ApplicationType>('savings');
  const [currency, setCurrency] = useState('USD');
  const [nickname, setNickname] = useState('');

  // Savings specific
  const [initialDeposit, setInitialDeposit] = useState('500');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveAmount, setAutoSaveAmount] = useState('100');

  // Current specific
  const [purpose, setPurpose] = useState<'personal' | 'business'>('personal');
  const [businessName, setBusinessName] = useState('');
  const [expectedVolume, setExpectedVolume] = useState('5000');
  const [overdraftRequested, setOverdraftRequested] = useState(false);

  // Fixed Deposit specific
  const [principal, setPrincipal] = useState('2500');
  const [termMonths, setTermMonths] = useState<3 | 6 | 12 | 24 | 36>(12);
  const [autoRenew, setAutoRenew] = useState(false);

  const { applications, isLoading, refetch } = useClientAccountApplications();
  const applyMutation = useApplyForAccount();
  const cancelMutation = useCancelApplication();

  const handleApply = () => {
    let payload: any = {
      type: selectedType,
      currency,
      nickname: nickname.trim() || undefined,
    };

    if (selectedType === 'savings') {
      const dep = Number(initialDeposit);
      if (isNaN(dep) || dep < 50) {
        Alert.alert('Validation Error', 'Minimum initial deposit for savings is $50.');
        return;
      }
      payload = {
        ...payload,
        initialDeposit: dep,
        goal: savingsGoal.trim() || undefined,
        autoSave,
        autoSaveAmount: autoSave ? Number(autoSaveAmount) || 50 : undefined,
      };
    } else if (selectedType === 'current') {
      payload = {
        ...payload,
        purpose,
        businessName: purpose === 'business' ? businessName.trim() : undefined,
        expectedMonthlyVolume: Number(expectedVolume) || 1000,
        overdraftRequested,
      };
    } else if (selectedType === 'fixed_deposit') {
      const princ = Number(principal);
      if (isNaN(princ) || princ < 500) {
        Alert.alert('Validation Error', 'Minimum deposit for Fixed Term is $500.');
        return;
      }
      const rate = FIXED_DEPOSIT_RATES[termMonths] || 5.25;
      const matDate = new Date();
      matDate.setMonth(matDate.getMonth() + termMonths);

      payload = {
        ...payload,
        principal: princ,
        termMonths,
        interestRate: rate,
        maturityDate: matDate.toISOString(),
        autoRenew,
      };
    }

    applyMutation.mutate(payload, {
      onSuccess: () => {
        refetch();
        setActiveTab('history');
        Alert.alert(
          'Application Submitted',
          'Your account application is under compliance review. You can track status here.',
          [{ text: 'OK' }]
        );
      },
      onError: (err: any) => {
        Alert.alert('Application Failed', err?.message || 'Failed to submit application.');
      },
    });
  };

  const handleCancelApplication = (appId: string) => {
    Alert.alert('Cancel Application', 'Are you sure you want to cancel this pending application?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => {
          cancelMutation.mutate(appId, {
            onSuccess: () => {
              refetch();
            },
          });
        },
      },
    ]);
  };

  return (
    <AdaptiveScreen
      keyboardAvoiding
      onRefresh={() => { refetch(); }}
      refreshing={isLoading}
      header={
        <ScreenHeader
          title="Account Opening & Facilities"
          subtitle="Tier-regulated High Yield Savings, Current & Term Deposits"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
      {/* Tab Switcher: New Application vs Application Status */}
      <View style={s.tabSwitchRow}>
        <TouchableOpacity
          style={[s.tabSwitchBtn, activeTab === 'apply' && s.tabSwitchBtnActive]}
          onPress={() => setActiveTab('apply')}
          activeOpacity={0.7}
        >
          <Text style={[s.tabSwitchText, activeTab === 'apply' && s.tabSwitchTextActive]}>
            New Application
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabSwitchBtn, activeTab === 'history' && s.tabSwitchBtnActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <Text style={[s.tabSwitchText, activeTab === 'history' && s.tabSwitchTextActive]}>
            Applications ({applications.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'history' ? (
        /* APPLICATION HISTORY VIEW */
        <View style={s.historyWrap}>
          {applications.length === 0 ? (
            <Card style={s.emptyCard}>
              <CardContent style={s.emptyContent}>
                <Icon name="Receipt" size={ICON_SIZES.xl} color={theme.textMuted} />
                <Text style={s.emptyTitle}>No applications submitted</Text>
                <Text style={s.emptySub}>
                  Open a high-yield savings or fixed term account to earn guaranteed daily interest.
                </Text>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => setActiveTab('apply')}
                  style={{ marginTop: SPACING.sm }}
                >
                  Start New Application
                </Button>
              </CardContent>
            </Card>
          ) : (
            applications.map((app: any) => {
              const appId = app._id || app.id;
              const statusVariant =
                app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning';
              return (
                <Card key={appId} style={s.appCard}>
                  <CardContent style={s.appContent}>
                    <View style={s.appHeader}>
                      <View style={s.appTitleRow}>
                        <Icon
                          name={
                            app.type === 'savings'
                              ? 'PiggyBank'
                              : app.type === 'fixed_deposit'
                              ? 'Lock'
                              : 'Building'
                          }
                          size={ICON_SIZES.md}
                          color={theme.primary}
                        />
                        <View>
                          <Text style={s.appName}>
                            {app.type === 'savings'
                              ? 'High Yield Savings'
                              : app.type === 'fixed_deposit'
                              ? `Fixed Deposit (${app.termMonths} Mo)`
                              : 'Current Account'}
                          </Text>
                          <Text style={s.appCurrency}>
                            {app.currency} · {app.nickname || 'Standard Account'}
                          </Text>
                        </View>
                      </View>
                      <Badge variant={statusVariant} size="sm">
                        {app.status ? app.status.toUpperCase() : 'PENDING'}
                      </Badge>
                    </View>

                    <View style={s.appDetailsGrid}>
                      {app.initialDeposit !== undefined && (
                        <View style={s.appDetailItem}>
                          <Text style={s.appDetailLabel}>Initial Deposit</Text>
                          <Text style={s.appDetailVal}>${app.initialDeposit}</Text>
                        </View>
                      )}
                      {app.principal !== undefined && (
                        <View style={s.appDetailItem}>
                          <Text style={s.appDetailLabel}>Principal</Text>
                          <Text style={s.appDetailVal}>${app.principal}</Text>
                        </View>
                      )}
                      {app.interestRate !== undefined && (
                        <View style={s.appDetailItem}>
                          <Text style={s.appDetailLabel}>Yield (APY)</Text>
                          <Text style={[s.appDetailVal, { color: theme.success }]}>
                            {app.interestRate}%
                          </Text>
                        </View>
                      )}
                      <View style={s.appDetailItem}>
                        <Text style={s.appDetailLabel}>Submitted</Text>
                        <Text style={s.appDetailVal}>
                          {app.submittedAt
                            ? new Date(app.submittedAt).toLocaleDateString()
                            : 'Recent'}
                        </Text>
                      </View>
                    </View>

                    {app.rejectionReason && (
                      <View style={s.rejectionBox}>
                        <Text style={s.rejectionTitle}>Reason for Review Delay/Rejection:</Text>
                        <Text style={s.rejectionDesc}>{app.rejectionReason}</Text>
                      </View>
                    )}

                    {app.status === 'pending' && (
                      <View style={s.cancelActionRow}>
                        <Button
                          variant="danger"
                          size="sm"
                          onPress={() => handleCancelApplication(appId)}
                          isLoading={cancelMutation.isPending}
                        >
                          Cancel Application
                        </Button>
                      </View>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </View>
      ) : (
        /* NEW APPLICATION FORM VIEW */
        <View style={s.formWrap}>
          {/* Account Category Selector */}
          <Text style={s.fieldLabel}>Select Account Category</Text>
          <View style={s.categoryRow}>
            <TouchableOpacity
              style={[s.categoryCard, selectedType === 'savings' && s.categoryCardSelected]}
              onPress={() => setSelectedType('savings')}
              activeOpacity={0.7}
            >
              <Icon
                name="PiggyBank"
                size={ICON_SIZES.md}
                color={selectedType === 'savings' ? theme.primary : theme.textMuted}
              />
              <Text style={[s.categoryTitle, selectedType === 'savings' && s.categoryTitleSelected]}>
                Savings Vault
              </Text>
              <Text style={s.categoryRate}>{SAVINGS_INTEREST_RATE}% APY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.categoryCard, selectedType === 'fixed_deposit' && s.categoryCardSelected]}
              onPress={() => setSelectedType('fixed_deposit')}
              activeOpacity={0.7}
            >
              <Icon
                name="Lock"
                size={ICON_SIZES.md}
                color={selectedType === 'fixed_deposit' ? theme.primary : theme.textMuted}
              />
              <Text style={[s.categoryTitle, selectedType === 'fixed_deposit' && s.categoryTitleSelected]}>
                Fixed Term
              </Text>
              <Text style={s.categoryRate}>Up to 6.1% APY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.categoryCard, selectedType === 'current' && s.categoryCardSelected]}
              onPress={() => setSelectedType('current')}
              activeOpacity={0.7}
            >
              <Icon
                name="Building"
                size={ICON_SIZES.md}
                color={selectedType === 'current' ? theme.primary : theme.textMuted}
              />
              <Text style={[s.categoryTitle, selectedType === 'current' && s.categoryTitleSelected]}>
                Current Acct
              </Text>
              <Text style={s.categoryRate}>Overdraft opt.</Text>
            </TouchableOpacity>
          </View>

          {/* Currency and Nickname */}
          <Card style={s.inputCard}>
            <CardContent style={s.inputContent}>
              <View style={s.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.formLabel}>Denomination Currency</Text>
                  <View style={s.currencyPillRow}>
                    {['USD', 'EUR', 'GBP'].map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[s.currencyPill, currency === c && s.currencyPillSelected]}
                        onPress={() => setCurrency(c)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.currencyPillText, currency === c && s.currencyPillTextSelected]}>
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={[s.formLabel, { marginTop: SPACING.sm }]}>Account Nickname</Text>
              <TextInput
                style={s.textInput}
                placeholder="e.g. Tax Reserve or Wealth Vault"
                placeholderTextColor={theme.textMuted}
                value={nickname}
                onChangeText={setNickname}
              />
            </CardContent>
          </Card>

          {/* SPECIFIC FIELDS: SAVINGS */}
          {selectedType === 'savings' && (
            <Card style={s.inputCard}>
              <CardContent style={s.inputContent}>
                <Text style={s.sectionHeader}>Savings Vault Parameters</Text>
                <Text style={s.formLabel}>Initial Deposit Amount ($)</Text>
                <TextInput
                  style={s.textInput}
                  keyboardType="numeric"
                  value={initialDeposit}
                  onChangeText={setInitialDeposit}
                  placeholder="500"
                  placeholderTextColor={theme.textMuted}
                />

                <Text style={s.formLabel}>Target Goal Purpose (Optional)</Text>
                <TextInput
                  style={s.textInput}
                  value={savingsGoal}
                  onChangeText={setSavingsGoal}
                  placeholder="e.g. Home Downpayment or Emergency"
                  placeholderTextColor={theme.textMuted}
                />

                <View style={s.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.switchLabel}>Automated Monthly Deposit</Text>
                    <Text style={s.switchSub}>Automate recurring transfers into this vault</Text>
                  </View>
                  <Switch value={autoSave} onValueChange={setAutoSave} />
                </View>

                {autoSave && (
                  <>
                    <Text style={[s.formLabel, { marginTop: SPACING.sm }]}>
                      Monthly Auto-Save Amount ($)
                    </Text>
                    <TextInput
                      style={s.textInput}
                      keyboardType="numeric"
                      value={autoSaveAmount}
                      onChangeText={setAutoSaveAmount}
                      placeholder="100"
                      placeholderTextColor={theme.textMuted}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* SPECIFIC FIELDS: FIXED DEPOSIT */}
          {selectedType === 'fixed_deposit' && (
            <Card style={s.inputCard}>
              <CardContent style={s.inputContent}>
                <Text style={s.sectionHeader}>Fixed Term Terms & Yields</Text>
                <Text style={s.formLabel}>Principal Investment ($)</Text>
                <TextInput
                  style={s.textInput}
                  keyboardType="numeric"
                  value={principal}
                  onChangeText={setPrincipal}
                  placeholder="2500"
                  placeholderTextColor={theme.textMuted}
                />

                <Text style={s.formLabel}>Lock Term (Months)</Text>
                <View style={s.termGrid}>
                  {([3, 6, 12, 24, 36] as const).map((months) => {
                    const isSelected = termMonths === months;
                    const rate = FIXED_DEPOSIT_RATES[months];
                    return (
                      <TouchableOpacity
                        key={months}
                        style={[s.termCard, isSelected && s.termCardSelected]}
                        onPress={() => setTermMonths(months)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.termMonths, isSelected && s.termMonthsSelected]}>
                          {months} Mo
                        </Text>
                        <Text style={[s.termRate, isSelected && s.termRateSelected]}>
                          {rate}% APY
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Calculated Return */}
                <View style={s.payoutPreviewBox}>
                  <Text style={s.payoutLabel}>Estimated Maturity Payout</Text>
                  <Text style={s.payoutVal}>
                    ${(
                      Number(principal || 0) *
                      (1 + ((FIXED_DEPOSIT_RATES[termMonths] || 5.25) / 100) * (termMonths / 12))
                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={s.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.switchLabel}>Auto-Renew on Maturity</Text>
                    <Text style={s.switchSub}>Re-invest principal and interest at prevailing rate</Text>
                  </View>
                  <Switch value={autoRenew} onValueChange={setAutoRenew} />
                </View>
              </CardContent>
            </Card>
          )}

          {/* SPECIFIC FIELDS: CURRENT ACCOUNT */}
          {selectedType === 'current' && (
            <Card style={s.inputCard}>
              <CardContent style={s.inputContent}>
                <Text style={s.sectionHeader}>Current Account Facility</Text>
                <Text style={s.formLabel}>Account Purpose</Text>
                <View style={s.purposeRow}>
                  <TouchableOpacity
                    style={[s.purposeBtn, purpose === 'personal' && s.purposeBtnSelected]}
                    onPress={() => setPurpose('personal')}
                  >
                    <Text style={[s.purposeBtnText, purpose === 'personal' && s.purposeBtnTextSelected]}>
                      Personal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.purposeBtn, purpose === 'business' && s.purposeBtnSelected]}
                    onPress={() => setPurpose('business')}
                  >
                    <Text style={[s.purposeBtnText, purpose === 'business' && s.purposeBtnTextSelected]}>
                      Commercial / Business
                    </Text>
                  </TouchableOpacity>
                </View>

                {purpose === 'business' && (
                  <>
                    <Text style={[s.formLabel, { marginTop: SPACING.sm }]}>Registered Business Name</Text>
                    <TextInput
                      style={s.textInput}
                      value={businessName}
                      onChangeText={setBusinessName}
                      placeholder="e.g. Acme Corp Ltd"
                      placeholderTextColor={theme.textMuted}
                    />
                  </>
                )}

                <Text style={[s.formLabel, { marginTop: SPACING.sm }]}>Expected Monthly Flow ($)</Text>
                <TextInput
                  style={s.textInput}
                  keyboardType="numeric"
                  value={expectedVolume}
                  onChangeText={setExpectedVolume}
                  placeholder="5000"
                  placeholderTextColor={theme.textMuted}
                />

                <View style={s.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.switchLabel}>Request Overdraft Protection</Text>
                    <Text style={s.switchSub}>Allow transactions to process even if balance is negative</Text>
                  </View>
                  <Switch value={overdraftRequested} onValueChange={setOverdraftRequested} />
                </View>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <View style={s.submitWrap}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              isLoading={applyMutation.isPending}
              onPress={handleApply}
            >
              Submit Application for Review
            </Button>
          </View>
        </View>
      )}
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    tabSwitchRow: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 4,
      marginBottom: SPACING.md,
    },
    tabSwitchBtn: {
      flex: 1,
      paddingVertical: SPACING.sm,
      alignItems: 'center',
      borderRadius: RADIUS.md,
    },
    tabSwitchBtnActive: {
      backgroundColor: theme.primary,
    },
    tabSwitchText: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '700',
      color: theme.textMuted,
    },
    tabSwitchTextActive: {
      color: '#fff',
    },
    historyWrap: {
      gap: SPACING.sm,
      marginBottom: SPACING['3xl'],
    },
    emptyCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: SPACING.xl,
      alignItems: 'center',
    },
    emptyContent: {
      alignItems: 'center',
      gap: SPACING.xs,
    },
    emptyTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      color: theme.text,
      marginTop: SPACING.xs,
    },
    emptySub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 16,
    },
    appCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.sm,
    },
    appContent: {
      padding: SPACING.md,
    },
    appHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    appTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    appName: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '700',
      color: theme.text,
    },
    appCurrency: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
    },
    appDetailsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    appDetailItem: {
      width: '46%',
    },
    appDetailLabel: {
      fontSize: 10,
      color: theme.textMuted,
      textTransform: 'uppercase',
    },
    appDetailVal: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '700',
      color: theme.text,
    },
    rejectionBox: {
      backgroundColor: `${theme.danger}10`,
      borderRadius: RADIUS.sm,
      padding: SPACING.sm,
      marginTop: SPACING.xs,
    },
    rejectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.danger,
    },
    rejectionDesc: {
      fontSize: 11,
      color: theme.text,
      marginTop: 2,
    },
    cancelActionRow: {
      marginTop: SPACING.sm,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    formWrap: {
      gap: SPACING.md,
      marginBottom: SPACING['3xl'],
    },
    fieldLabel: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '700',
      color: theme.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    categoryRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    categoryCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: SPACING.sm,
      alignItems: 'center',
      gap: 4,
    },
    categoryCardSelected: {
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}0D`,
    },
    categoryTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    categoryTitleSelected: {
      color: theme.primary,
    },
    categoryRate: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.success,
    },
    inputCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inputContent: {
      padding: SPACING.md,
    },
    sectionHeader: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '800',
      color: theme.text,
      marginBottom: SPACING.sm,
    },
    formRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    formLabel: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      marginBottom: SPACING.xs,
      fontWeight: '600',
    },
    currencyPillRow: {
      flexDirection: 'row',
      gap: SPACING.xs,
    },
    currencyPill: {
      paddingVertical: 6,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    currencyPillSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary,
    },
    currencyPillText: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '700',
      color: theme.text,
    },
    currencyPillTextSelected: {
      color: '#fff',
    },
    textInput: {
      height: 44,
      backgroundColor: theme.background,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: SPACING.md,
      fontSize: FONT_SIZES.body,
      color: theme.text,
      marginBottom: SPACING.xs,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: SPACING.sm,
      paddingTop: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    switchLabel: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '700',
      color: theme.text,
    },
    switchSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
    },
    termGrid: {
      flexDirection: 'row',
      gap: SPACING.xs,
      marginBottom: SPACING.md,
    },
    termCard: {
      flex: 1,
      backgroundColor: theme.background,
      borderRadius: RADIUS.md,
      borderWidth: 1.5,
      borderColor: theme.border,
      paddingVertical: SPACING.sm,
      alignItems: 'center',
    },
    termCardSelected: {
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}12`,
    },
    termMonths: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.text,
    },
    termMonthsSelected: {
      color: theme.primary,
    },
    termRate: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.success,
      marginTop: 2,
    },
    termRateSelected: {
      color: theme.primary,
    },
    payoutPreviewBox: {
      backgroundColor: `${theme.success}10`,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      marginBottom: SPACING.sm,
      alignItems: 'center',
    },
    payoutLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textMuted,
      textTransform: 'uppercase',
    },
    payoutVal: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.success,
      marginTop: 2,
    },
    purposeRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    purposeBtn: {
      flex: 1,
      paddingVertical: SPACING.sm,
      alignItems: 'center',
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    purposeBtnSelected: {
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}12`,
    },
    purposeBtnText: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '700',
      color: theme.text,
    },
    purposeBtnTextSelected: {
      color: theme.primary,
    },
    submitWrap: {
      marginTop: SPACING.sm,
      marginBottom: SPACING['3xl'],
    },
  });
}
