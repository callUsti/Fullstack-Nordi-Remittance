// ============================================================================
// SEND & PAY SCREEN — Unified money movement hub with sub-nav
// Uses shared hooks, mobile reusables, AdaptiveScreen & luxury aesthetic tokens
// ============================================================================
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { SubNavTabs } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { QuerySection } from '@/components/shared/QuerySection';
import { BeneficiaryCard } from '@/components/banking/BeneficiaryCard';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { SPACING, FONT_SIZES, ICON_SIZES, RADIUS } from '@/constants/sizings';

// Shared API Queries
import { useWallets, useBeneficiaries } from '@nordi/shared/hooks/api-queries/useAccounts';
import { useLoans } from '@nordi/shared/hooks/api-queries/useLoans';
import { useSavingsGoals } from '@nordi/shared/hooks/api-queries/useInvestments';

const TABS = [
  { key: 'send', label: 'Send' },
  { key: 'bills', label: 'Bills' },
  { key: 'beneficiaries', label: 'Beneficiaries' },
  { key: 'savings', label: 'Savings' },
  { key: 'loans', label: 'Loans' },
];

const TRANSFER_CHANNELS = [
  { label: 'Domestic', icon: 'Home', route: '/screens/send-money/DomesticTransfer', key: 'domestic' },
  { label: 'International', icon: 'Globe', route: '/screens/send-money/InternationalTransfer', key: 'intl' },
  { label: 'Access Pay', icon: 'Building', route: '/screens/Transactions/AccessToAccess', key: 'internal' },
  { label: 'Instant Pay', icon: 'Zap', route: '/screens/send-money/InstantPayment', key: 'swift' },
  { label: 'Scan QR', icon: 'QrCode', route: '/(tabs)/scan', key: 'qr' },
  { label: 'Crypto Transfer', icon: 'Coins', route: '/screens/send-money/CryptoTransfer', key: 'crypto' },
];

const BILL_CATEGORIES = [
  { id: 'elec', label: 'Electricity', icon: 'Zap', due: 'Due Nov 5', amount: 120 },
  { id: 'water', label: 'Water', icon: 'Droplet', due: 'Due Nov 10', amount: 45 },
  { id: 'net', label: 'Internet', icon: 'Wifi', due: 'Due Nov 12', amount: 65 },
  { id: 'mobile', label: 'Mobile', icon: 'Smartphone', due: 'Due Nov 8', amount: 30 },
  { id: 'tv', label: 'Cable TV', icon: 'Tv', due: 'Due Nov 15', amount: 55 },
  { id: 'rent', label: 'Rent / Mortgage', icon: 'Home', due: 'Due Nov 1', amount: 800 },
];

export default function SendPayScreen() {
  const [activeTab, setActiveTab] = useState('send');
  const [amount, setAmount] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('/screens/send-money/DomesticTransfer');
  const [beneficiarySearch, setBeneficiarySearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  // Queries
  const { data: walletsData, refetch: refetchWallets } = useWallets();
  const { data: beneficiariesData, isLoading: isLoadingBen, isError: isErrorBen, refetch: refetchBen } = useBeneficiaries();
  const { data: loansData, isLoading: isLoadingLoans, isError: isErrorLoans, refetch: refetchLoans } = useLoans();
  const { data: savingsData, isLoading: isLoadingSavings, isError: isErrorSavings, refetch: refetchSavings } = useSavingsGoals();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      refetchWallets?.(),
      refetchBen?.(),
      refetchLoans?.(),
      refetchSavings?.(),
    ]);
    setRefreshing(false);
  };

  // Primary available balance calculation
  const availableBalance = useMemo(() => {
    if (walletsData && Array.isArray(walletsData) && walletsData.length > 0) {
      const primaryWallet = walletsData[0] as any;
      return Number(primaryWallet?.balance || primaryWallet?.primaryCurrencyBalance || 24562.80);
    }
    return 24562.80;
  }, [walletsData]);

  // Beneficiaries list normalization
  const beneficiariesList = useMemo(() => {
    const list = Array.isArray(beneficiariesData)
      ? beneficiariesData
      : (beneficiariesData as any)?.data || [];

    if (list.length > 0) {
      return list.map((b: any) => ({
        id: b.id || b.beneficiaryId || String(Math.random()),
        name: b.name || b.accountName || b.beneficiaryName || 'Beneficiary',
        bankName: b.bankName || 'Nordi Remit',
        accountNumber: b.accountNumber || b.accountNo || '•••• 4421',
        currency: b.currency || 'USD',
        isFavorite: !!b.isFavorite,
      }));
    }

    return [
      { id: '1', name: 'Alice Morgan', bankName: 'Nordi Remit', accountNumber: '•••• 8821', currency: 'USD', isFavorite: true },
      { id: '2', name: 'Bob Kim', bankName: 'Chase Bank', accountNumber: '•••• 3190', currency: 'USD', isFavorite: false },
      { id: '3', name: 'Carol Silva', bankName: 'Barclays UK', accountNumber: '•••• 1204', currency: 'GBP', isFavorite: true },
      { id: '4', name: 'David Osei', bankName: 'Standard Chartered', accountNumber: '•••• 9942', currency: 'EUR', isFavorite: false },
    ];
  }, [beneficiariesData]);

  const filteredBeneficiaries = useMemo(() => {
    if (!beneficiarySearch.trim()) return beneficiariesList;
    return beneficiariesList.filter((b: any) =>
      b.name.toLowerCase().includes(beneficiarySearch.toLowerCase()) ||
      b.bankName.toLowerCase().includes(beneficiarySearch.toLowerCase())
    );
  }, [beneficiariesList, beneficiarySearch]);

  // Loans list normalization
  const loansList = useMemo(() => {
    const list = Array.isArray(loansData) ? loansData : (loansData as any)?.data || [];
    if (list.length > 0) return list;
    return [
      { id: '1', name: 'Personal Micro-Loan', outstanding: 8500, emi: 420, nextDue: 'Nov 15', rate: 9.5, tenure: '24 months', status: 'ACTIVE' },
      { id: '2', name: 'Home Renovation Loan', outstanding: 142000, emi: 1200, nextDue: 'Nov 5', rate: 7.2, tenure: '180 months', status: 'ACTIVE' },
    ];
  }, [loansData]);

  // Savings goals list normalization
  const savingsList = useMemo(() => {
    const list = Array.isArray(savingsData) ? savingsData : (savingsData as any)?.data || [];
    if (list.length > 0) return list;
    return [
      { id: '1', name: 'Emergency Vault', target: 10000, saved: 8500, color: theme.primary },
      { id: '2', name: 'Summer Holiday', target: 5000, saved: 3200, color: theme.text },
      { id: '3', name: 'Electric Vehicle Fund', target: 25000, saved: 12400, color: theme.primary },
    ];
  }, [savingsData, theme]);

  const handleInitiateTransfer = () => {
    router.push({
      pathname: selectedChannel as any,
      params: { amount: amount || '0' },
    });
  };

  // ── SEND TAB CONTENT ───────────────────────────────────────────────────────
  const renderSend = () => (
    <View style={s.tabContentWrapper}>
      {/* High-density Amount Card */}
      <Card style={s.cardWrapper}>
        <CardContent style={s.cardInner}>
          <View style={s.amountHeaderRow}>
            <Text style={s.amountLabel}>AMOUNT TO SEND</Text>
            <View style={s.balancePill}>
              <Text style={s.balanceText}>
                Bal: ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <View style={s.amountInputRow}>
            <Text style={s.currencyPrefix}>$</Text>
            <TextInput
              style={s.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.border}
            />
          </View>

          <View style={s.quickChipRow}>
            {['50', '100', '500', '1000', '5000'].map((q) => (
              <TouchableOpacity
                key={q}
                style={[s.quickChip, amount === q && s.quickChipActive]}
                onPress={() => setAmount(q)}
                activeOpacity={0.7}
              >
                <Text style={[s.quickChipText, amount === q && s.quickChipTextActive]}>
                  ${q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* Transfer Channels */}
      <View style={s.sectionHeaderRow}>
        <Text style={s.sectionTitle}>TRANSFER CHANNEL</Text>
        <Text style={s.sectionSub}>Pick route</Text>
      </View>

      <View style={s.channelGrid}>
        {TRANSFER_CHANNELS.map((ch) => {
          const isSelected = selectedChannel === ch.route;
          return (
            <TouchableOpacity
              key={ch.key}
              style={[s.channelCard, isSelected && s.channelCardSelected]}
              onPress={() => setSelectedChannel(ch.route)}
              activeOpacity={0.8}
            >
              <View style={[s.channelIconWrapper, isSelected && s.channelIconWrapperSelected]}>
                <Icon
                  name={ch.icon}
                  size={ICON_SIZES.sm}
                  color={isSelected ? theme.primary : theme.text}
                />
              </View>
              <Text style={[s.channelLabel, isSelected && s.channelLabelSelected]} numberOfLines={1}>
                {ch.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Primary Continue Button */}
      <View style={s.ctaWrapper}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleInitiateTransfer}
        >
          {amount ? `Continue with $${amount}` : 'Continue Transfer'}
        </Button>
      </View>

      {/* Recent Beneficiaries Horizontal Bar */}
      <View style={s.sectionHeaderRow}>
        <Text style={s.sectionTitle}>RECENT RECIPIENTS</Text>
        <TouchableOpacity onPress={() => setActiveTab('beneficiaries')}>
          <Text style={s.viewAllLink}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recipientsRow}>
        <TouchableOpacity
          style={s.addRecipientItem}
          onPress={() => router.push('/screens/beneficiaries/AddBeneficiary')}
          activeOpacity={0.7}
        >
          <View style={s.addRecipientCircle}>
            <Icon name="Plus" size={ICON_SIZES.sm} color={theme.primary} />
          </View>
          <Text style={s.recipientName}>Add New</Text>
        </TouchableOpacity>

        {beneficiariesList.slice(0, 6).map((ben: any) => (
          <TouchableOpacity
            key={ben.id}
            style={s.recipientItem}
            onPress={() => {
              router.push({
                pathname: '/screens/send-money/DomesticTransfer' as any,
                params: { recipientId: ben.id, name: ben.name },
              });
            }}
            activeOpacity={0.7}
          >
            <Avatar name={ben.name} size="md" />
            <Text style={s.recipientName} numberOfLines={1}>
              {ben.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // ── BILLS TAB CONTENT ──────────────────────────────────────────────────────
  const renderBills = () => (
    <View style={s.tabContentWrapper}>
      <Card style={s.cardWrapper}>
        <CardContent style={s.billsSummaryRow}>
          <View style={s.billsStat}>
            <Text style={s.billsStatValue}>$1,115.00</Text>
            <Text style={s.billsStatLabel}>Total Due</Text>
          </View>
          <View style={s.dividerVertical} />
          <View style={s.billsStat}>
            <Badge variant="warning" size="sm">3 Pending</Badge>
            <Text style={s.billsStatLabel}>Next: Nov 5</Text>
          </View>
          <View style={s.dividerVertical} />
          <View style={s.billsStat}>
            <Badge variant="success" size="sm">2 Auto-pay</Badge>
            <Text style={s.billsStatLabel}>Active</Text>
          </View>
        </CardContent>
      </Card>

      <View style={s.sectionHeaderRow}>
        <Text style={s.sectionTitle}>UTILITIES & RECURRING</Text>
      </View>

      <View style={s.billsGrid}>
        {BILL_CATEGORIES.map((bill) => (
          <Card key={bill.id} style={s.billCard}>
            <CardContent style={s.billCardInner}>
              <View style={s.billIconBox}>
                <Icon name={bill.icon} size={ICON_SIZES.sm} color={theme.primary} />
              </View>
              <Text style={s.billName}>{bill.label}</Text>
              <Text style={s.billAmount}>${bill.amount}</Text>
              <Text style={s.billDue}>{bill.due}</Text>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onPress={() => {
                  setAmount(String(bill.amount));
                  setActiveTab('send');
                }}
              >
                Pay Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </View>
    </View>
  );

  // ── BENEFICIARIES TAB CONTENT ──────────────────────────────────────────────
  const renderBeneficiaries = () => (
    <View style={s.tabContentWrapper}>
      <View style={s.searchWrap}>
        <Icon name="Search" size={ICON_SIZES.sm} color={theme.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or bank..."
          placeholderTextColor={theme.textMuted}
          value={beneficiarySearch}
          onChangeText={setBeneficiarySearch}
        />
      </View>

      <View style={s.addBenCtaRow}>
        <Button
          variant="outline"
          size="md"
          fullWidth
          onPress={() => router.push('/screens/beneficiaries/AddBeneficiary')}
        >
          Add New Beneficiary
        </Button>
      </View>

      <QuerySection
        isLoading={isLoadingBen}
        isError={isErrorBen}
        isEmpty={filteredBeneficiaries.length === 0}
        onRetry={refetchBen}
        emptyTitle="No beneficiaries found"
        emptyDescription="Add recipients to send money instantly across accounts."
      >
        <View style={s.beneficiaryList}>
          {filteredBeneficiaries.map((ben: any) => (
            <BeneficiaryCard
              key={ben.id}
              beneficiary={ben}
              onSendMoney={(recipient) => {
                router.push({
                  pathname: '/screens/send-money/DomesticTransfer' as any,
                  params: { recipientId: recipient.id, name: recipient.name },
                });
              }}
            />
          ))}
        </View>
      </QuerySection>
    </View>
  );

  // ── SAVINGS GOALS TAB CONTENT ──────────────────────────────────────────────
  const renderSavings = () => (
    <View style={s.tabContentWrapper}>
      <View style={s.addBenCtaRow}>
        <Button
          variant="primary"
          size="md"
          fullWidth
          onPress={() => router.push('/screens/savings/CreateGoal')}
        >
          Create New Savings Vault
        </Button>
      </View>

      <QuerySection
        isLoading={isLoadingSavings}
        isError={isErrorSavings}
        isEmpty={savingsList.length === 0}
        onRetry={refetchSavings}
      >
        <View style={s.cardList}>
          {savingsList.map((goal: any) => {
            const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
            return (
              <Card key={goal.id} style={s.goalCard}>
                <CardContent style={s.goalCardInner}>
                  <View style={s.goalTopRow}>
                    <View style={s.goalIconCircle}>
                      <Icon name="PiggyBank" size={ICON_SIZES.sm} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.goalName}>{goal.name}</Text>
                      <Text style={s.goalMeta}>
                        ${Number(goal.saved).toLocaleString()} of ${Number(goal.target).toLocaleString()}
                      </Text>
                    </View>
                    <Badge variant={pct >= 80 ? 'success' : 'outline'} size="sm">{pct}%</Badge>
                  </View>

                  <View style={s.progressBarTrack}>
                    <View style={[s.progressBarFill, { width: `${pct}%`, backgroundColor: theme.primary }]} />
                  </View>
                </CardContent>
              </Card>
            );
          })}
        </View>
      </QuerySection>
    </View>
  );

  // ── LOANS TAB CONTENT ──────────────────────────────────────────────────────
  const renderLoans = () => (
    <View style={s.tabContentWrapper}>
      <View style={s.addBenCtaRow}>
        <Button
          variant="primary"
          size="md"
          fullWidth
          onPress={() => router.push('/screens/loans/ApplyForLoan')}
        >
          Apply for Credit Line
        </Button>
      </View>

      <QuerySection
        isLoading={isLoadingLoans}
        isError={isErrorLoans}
        isEmpty={loansList.length === 0}
        onRetry={refetchLoans}
      >
        <View style={s.cardList}>
          {loansList.map((loan: any) => (
            <Card key={loan.id} style={s.loanCard}>
              <CardContent style={s.loanCardInner}>
                <View style={s.loanTopRow}>
                  <View>
                    <Text style={s.loanTitle}>{loan.name}</Text>
                    <Text style={s.loanSub}>{loan.rate}% APR · {loan.tenure || 'Flexible'}</Text>
                  </View>
                  <Badge variant="success" size="sm">Active</Badge>
                </View>

                <View style={s.loanMetricsGrid}>
                  <View style={s.loanMetric}>
                    <Text style={s.loanMetricValue}>${Number(loan.outstanding).toLocaleString()}</Text>
                    <Text style={s.loanMetricLabel}>Outstanding</Text>
                  </View>
                  <View style={s.loanMetric}>
                    <Text style={s.loanMetricValue}>${Number(loan.emi).toLocaleString()}</Text>
                    <Text style={s.loanMetricLabel}>Monthly EMI</Text>
                  </View>
                  <View style={s.loanMetric}>
                    <Text style={s.loanMetricValue}>{loan.nextDue || 'Upcoming'}</Text>
                    <Text style={s.loanMetricLabel}>Next Due</Text>
                  </View>
                </View>

                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onPress={() => {
                    setAmount(String(loan.emi));
                    setActiveTab('send');
                  }}
                >
                  Pay Installment (${loan.emi})
                </Button>
              </CardContent>
            </Card>
          ))}
        </View>
      </QuerySection>
    </View>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'bills':
        return renderBills();
      case 'beneficiaries':
        return renderBeneficiaries();
      case 'savings':
        return renderSavings();
      case 'loans':
        return renderLoans();
      default:
        return renderSend();
    }
  };

  return (
    <AdaptiveScreen withTabBar={true} onRefresh={onRefresh} refreshing={refreshing}>
      {/* Top Header */}
      <View style={s.topHeader}>
        <View>
          <Text style={s.headerSubtitle}>MONEY MOVEMENT</Text>
          <Text style={s.headerTitle}>Send & Pay</Text>
        </View>
        <TouchableOpacity
          style={s.headerBtn}
          onPress={() => router.push('/screens/Transactions' as any)}
          activeOpacity={0.7}
        >
          <Icon name="Clock" size={ICON_SIZES.sm} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Sub Nav Tab Bar */}
      <View style={s.subNavWrap}>
        <SubNavTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      {/* Active Tab View */}
      {renderActiveTab()}
    </AdaptiveScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    topHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
      marginTop: SPACING.xs,
    },
    headerSubtitle: {
      fontSize: FONT_SIZES.nano,
      letterSpacing: 1.2,
      fontWeight: '700',
      color: theme.primary,
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: FONT_SIZES.hero,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.5,
    },
    headerBtn: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subNavWrap: {
      marginBottom: SPACING.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    tabContentWrapper: {
      paddingBottom: SPACING.lg,
    },
    cardWrapper: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    cardInner: {
      padding: SPACING.md,
    },
    amountHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.xs,
    },
    amountLabel: {
      fontSize: FONT_SIZES.micro,
      fontWeight: '700',
      letterSpacing: 1,
      color: theme.textMuted,
    },
    balancePill: {
      backgroundColor: theme.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: RADIUS.full,
    },
    balanceText: {
      fontSize: FONT_SIZES.nano,
      fontWeight: '600',
      color: theme.text,
    },
    amountInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.xs,
    },
    currencyPrefix: {
      fontSize: FONT_SIZES.hero,
      fontWeight: '800',
      color: theme.text,
      marginRight: SPACING.xs,
    },
    amountInput: {
      flex: 1,
      fontSize: FONT_SIZES.hero,
      fontWeight: '800',
      color: theme.text,
      padding: 0,
    },
    quickChipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      marginTop: SPACING.sm,
    },
    quickChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },
    quickChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    quickChipText: {
      fontSize: FONT_SIZES.nano,
      fontWeight: '700',
      color: theme.text,
    },
    quickChipTextActive: {
      color: '#FFFFFF',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: SPACING.sm,
      marginBottom: SPACING.xs,
      paddingHorizontal: SPACING.xxs,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.micro,
      fontWeight: '700',
      letterSpacing: 1,
      color: theme.textMuted,
    },
    sectionSub: {
      fontSize: FONT_SIZES.nano,
      color: theme.textMuted,
    },
    viewAllLink: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '600',
      color: theme.primary,
    },
    channelGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.xs,
      marginBottom: SPACING.md,
    },
    channelCard: {
      width: '31.5%',
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xs,
      alignItems: 'center',
    },
    channelCardSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primarySoft,
    },
    channelIconWrapper: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.md,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.xs,
    },
    channelIconWrapperSelected: {
      backgroundColor: `${theme.primary}20`,
    },
    channelLabel: {
      fontSize: FONT_SIZES.micro,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
    },
    channelLabelSelected: {
      color: theme.primary,
      fontWeight: '700',
    },
    ctaWrapper: {
      marginBottom: SPACING.lg,
    },
    recipientsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      paddingVertical: SPACING.xs,
    },
    addRecipientItem: {
      alignItems: 'center',
    },
    addRecipientCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    recipientItem: {
      alignItems: 'center',
    },
    recipientName: {
      fontSize: FONT_SIZES.nano,
      fontWeight: '600',
      color: theme.text,
      marginTop: 4,
      maxWidth: 52,
    },
    billsSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.md,
    },
    billsStat: {
      alignItems: 'center',
      flex: 1,
    },
    billsStatValue: {
      fontSize: FONT_SIZES.titleSm,
      fontWeight: '800',
      color: theme.text,
    },
    billsStatLabel: {
      fontSize: FONT_SIZES.nano,
      color: theme.textMuted,
      marginTop: 2,
    },
    dividerVertical: {
      width: 1,
      height: 24,
      backgroundColor: theme.border,
    },
    billsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.xs,
    },
    billCard: {
      width: '48.5%',
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.xs,
    },
    billCardInner: {
      padding: SPACING.sm,
      alignItems: 'center',
    },
    billIconBox: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.md,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    billName: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      color: theme.text,
    },
    billAmount: {
      fontSize: FONT_SIZES.titleSm,
      fontWeight: '800',
      color: theme.text,
      marginTop: 2,
    },
    billDue: {
      fontSize: FONT_SIZES.nano,
      color: theme.textMuted,
      marginBottom: 8,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      marginBottom: SPACING.sm,
    },
    searchInput: {
      flex: 1,
      marginLeft: SPACING.xs,
      fontSize: FONT_SIZES.body,
      color: theme.text,
      padding: 0,
    },
    addBenCtaRow: {
      marginBottom: SPACING.sm,
    },
    beneficiaryList: {
      gap: SPACING.xs,
    },
    cardList: {
      gap: SPACING.xs,
    },
    goalCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    goalCardInner: {
      padding: SPACING.md,
    },
    goalTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    goalIconCircle: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.md,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.sm,
    },
    goalName: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      color: theme.text,
    },
    goalMeta: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      marginTop: 1,
    },
    progressBarTrack: {
      height: 4,
      backgroundColor: theme.surfaceAlt,
      borderRadius: RADIUS.full,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: RADIUS.full,
    },
    loanCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    loanCardInner: {
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    loanTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    loanTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      color: theme.text,
    },
    loanSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      marginTop: 2,
    },
    loanMetricsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: theme.surfaceAlt,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
    },
    loanMetric: {
      alignItems: 'center',
    },
    loanMetricValue: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      color: theme.text,
    },
    loanMetricLabel: {
      fontSize: FONT_SIZES.nano,
      color: theme.textMuted,
      marginTop: 2,
    },
  });
