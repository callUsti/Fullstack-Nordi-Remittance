// ============================================================================
// SEND & PAY SCREEN — Unified money movement hub with sub-nav
// Uses shared hooks, mobile reusables, and luxury aesthetic tokens
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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { SubNavTabs } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { QuerySection } from '@/components/shared/QuerySection';
import { EmptyState } from '@/components/shared/EmptyState';
import { BeneficiaryCard } from '@/components/banking/BeneficiaryCard';

// Shared API Queries
import { useWallets, useBeneficiaries } from '@nordi/shared/hooks/api-queries/useAccounts';
import { useLoans } from '@nordi/shared/hooks/api-queries/useLoans';
import { useSavingsGoals } from '@nordi/shared/hooks/api-queries/useInvestments';

const STATUS_BAR_H = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

const TABS = [
  { key: 'send', label: 'Send' },
  { key: 'bills', label: 'Bills' },
  { key: 'beneficiaries', label: 'Beneficiaries' },
  { key: 'savings', label: 'Savings Goals' },
  { key: 'loans', label: 'Loans' },
];

const TRANSFER_CHANNELS = [
  { label: 'Domestic', icon: 'home-outline', route: '/screens/Homescreens/Transfer', key: 'domestic' },
  { label: 'International', icon: 'globe-outline', route: '/screens/Transactions/AccessInternational', key: 'intl' },
  { label: 'Access-to-Access', icon: 'business-outline', route: '/screens/Transactions/AccessToAccess', key: 'internal' },
  { label: 'SwiftPay', icon: 'flash-outline', route: '/screens/Transactions/AccessSwiftPay', key: 'swift' },
  { label: 'QR Pay', icon: 'qr-code-outline', route: '/(tabs)/scan', key: 'qr' },
  { label: 'Crypto', icon: 'logo-bitcoin', route: '/screens/Transactions/AccessCrypto', key: 'crypto' },
];

const BILL_CATEGORIES = [
  { id: 'elec', label: 'Electricity', icon: 'flash', due: 'Due Nov 5', amount: 120 },
  { id: 'water', label: 'Water', icon: 'water', due: 'Due Nov 10', amount: 45 },
  { id: 'net', label: 'Internet', icon: 'wifi', due: 'Due Nov 12', amount: 65 },
  { id: 'mobile', label: 'Mobile', icon: 'phone-portrait', due: 'Due Nov 8', amount: 30 },
  { id: 'tv', label: 'Cable TV', icon: 'tv', due: 'Due Nov 15', amount: 55 },
  { id: 'rent', label: 'Mortgage/Rent', icon: 'home', due: 'Due Nov 1', amount: 800 },
];

export default function SendPayScreen() {
  const [activeTab, setActiveTab] = useState('send');
  const [amount, setAmount] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('/screens/Homescreens/Transfer');
  const [beneficiarySearch, setBeneficiarySearch] = useState('');

  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  // Queries
  const { data: walletsData, isLoading: isLoadingWallets } = useWallets();
  const { data: beneficiariesData, isLoading: isLoadingBen, isError: isErrorBen, refetch: refetchBen } = useBeneficiaries();
  const { data: loansData, isLoading: isLoadingLoans, isError: isErrorLoans, refetch: refetchLoans } = useLoans();
  const { data: savingsData, isLoading: isLoadingSavings, isError: isErrorSavings, refetch: refetchSavings } = useSavingsGoals();

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

    // Default high-profile fallback if initial backend has no saved items
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

  // ── SEND TAB ─────────────────────────────────────────────────────────────
  const renderSend = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
      {/* High-density Amount Card */}
      <Card variant="default" style={s.cardWrapper}>
        <CardContent style={s.cardInner}>
          <View style={s.amountHeaderRow}>
            <Text style={s.amountLabel}>You send</Text>
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
            {['50', '100', '500', '1,000', '5,000'].map(q => (
              <TouchableOpacity
                key={q}
                style={[s.quickChip, amount === q.replace(',', '') && s.quickChipActive]}
                onPress={() => setAmount(q.replace(',', ''))}
                activeOpacity={0.7}
              >
                <Text style={[s.quickChipText, amount === q.replace(',', '') && s.quickChipTextActive]}>
                  ${q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* Transfer Channels */}
      <View style={s.sectionHeaderRow}>
        <Text style={s.sectionTitle}>Transfer Channel</Text>
        <Text style={s.sectionSub}>Select destination</Text>
      </View>

      <View style={s.channelGrid}>
        {TRANSFER_CHANNELS.map(ch => {
          const isSelected = selectedChannel === ch.route;
          return (
            <TouchableOpacity
              key={ch.key}
              style={[s.channelCard, isSelected && s.channelCardSelected]}
              onPress={() => setSelectedChannel(ch.route)}
              activeOpacity={0.8}
            >
              <View style={[s.channelIconWrapper, isSelected && s.channelIconWrapperSelected]}>
                <Ionicons
                  name={ch.icon as any}
                  size={18}
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
          leftIcon={<Ionicons name="arrow-forward" size={18} color="#ffffff" />}
        >
          {amount ? `Continue with $${amount}` : 'Continue Transfer'}
        </Button>
      </View>

      {/* Recent Beneficiaries Horizontal Bar */}
      <View style={s.sectionHeaderRow}>
        <Text style={s.sectionTitle}>Recent Recipients</Text>
        <TouchableOpacity onPress={() => setActiveTab('beneficiaries')}>
          <Text style={s.viewAllLink}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recipientsRow}>
        <TouchableOpacity
          style={s.addRecipientItem}
          onPress={() => router.push('/screens/Transactions/AccessToOthers' as any)}
          activeOpacity={0.7}
        >
          <View style={s.addRecipientCircle}>
            <Ionicons name="add" size={20} color={theme.primary} />
          </View>
          <Text style={s.recipientName}>Add New</Text>
        </TouchableOpacity>

        {beneficiariesList.slice(0, 6).map((ben: any) => (
          <TouchableOpacity
            key={ben.id}
            style={s.recipientItem}
            onPress={() => {
              router.push({
                pathname: '/screens/Homescreens/Transfer' as any,
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
    </ScrollView>
  );

  // ── BILLS TAB ────────────────────────────────────────────────────────────
  const renderBills = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
      <Card variant="default" style={s.cardWrapper}>
        <CardContent style={s.billsSummaryRow}>
          <View style={s.billsStat}>
            <Text style={s.billsStatValue}>$1,115.00</Text>
            <Text style={s.billsStatLabel}>Total Due</Text>
          </View>
          <View style={s.dividerVertical} />
          <View style={s.billsStat}>
            <Badge variant="warning">3 Pending</Badge>
            <Text style={s.billsStatLabel}>Next: Nov 5</Text>
          </View>
          <View style={s.dividerVertical} />
          <View style={s.billsStat}>
            <Badge variant="success">2 Auto-pay</Badge>
            <Text style={s.billsStatLabel}>Active</Text>
          </View>
        </CardContent>
      </Card>

      <View style={s.sectionHeaderRow}>
        <Text style={s.sectionTitle}>Utility & Recurring Bills</Text>
      </View>

      <View style={s.billsGrid}>
        {BILL_CATEGORIES.map(bill => (
          <Card key={bill.id} variant="default" style={s.billCard}>
            <CardContent style={s.billCardInner}>
              <View style={s.billIconBox}>
                <Ionicons name={bill.icon as any} size={20} color={theme.primary} />
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
    </ScrollView>
  );

  // ── BENEFICIARIES TAB ────────────────────────────────────────────────────
  const renderBeneficiaries = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search beneficiaries by name or bank..."
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
          leftIcon={<Ionicons name="person-add-outline" size={16} color={theme.primary} />}
          onPress={() => router.push('/screens/Transactions/AccessToOthers' as any)}
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
                  pathname: '/screens/Homescreens/Transfer' as any,
                  params: { recipientId: recipient.id, name: recipient.name },
                });
              }}
            />
          ))}
        </View>
      </QuerySection>
    </ScrollView>
  );

  // ── SAVINGS GOALS TAB ────────────────────────────────────────────────────
  const renderSavings = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
      <View style={s.addBenCtaRow}>
        <Button
          variant="primary"
          size="md"
          fullWidth
          leftIcon={<Ionicons name="add-circle-outline" size={18} color="#ffffff" />}
          onPress={() => router.push('/screens/banking/accounts' as any)}
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
              <Card key={goal.id} variant="default" style={s.goalCard}>
                <CardContent style={s.goalCardInner}>
                  <View style={s.goalTopRow}>
                    <View style={s.goalIconCircle}>
                      <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.goalName}>{goal.name}</Text>
                      <Text style={s.goalMeta}>
                        ${Number(goal.saved).toLocaleString()} of ${Number(goal.target).toLocaleString()}
                      </Text>
                    </View>
                    <Badge variant={pct >= 80 ? 'success' : 'info'}>{pct}%</Badge>
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
    </ScrollView>
  );

  // ── LOANS TAB ────────────────────────────────────────────────────────────
  const renderLoans = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
      <View style={s.addBenCtaRow}>
        <Button
          variant="primary"
          size="md"
          fullWidth
          leftIcon={<Ionicons name="document-text-outline" size={18} color="#ffffff" />}
          onPress={() => router.push('/screens/banking/loans' as any)}
        >
          Apply for a Loan or Credit Line
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
            <Card key={loan.id} variant="default" style={s.loanCard}>
              <CardContent style={s.loanCardInner}>
                <View style={s.loanTopRow}>
                  <View>
                    <Text style={s.loanTitle}>{loan.name}</Text>
                    <Text style={s.loanSub}>{loan.rate}% APR · {loan.tenure || 'Flexible'}</Text>
                  </View>
                  <Badge variant="success">Active</Badge>
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
    </ScrollView>
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
    <View style={s.container}>
      <View style={s.topNavHeader}>
        <View>
          <Text style={s.navTitle}>Send & Pay</Text>
          <Text style={s.navSubtitle}>Unified remittance & payments</Text>
        </View>
        <TouchableOpacity
          style={s.historyButton}
          onPress={() => router.push('/screens/banking/transactions' as any)}
          accessibilityLabel="Transaction History"
        >
          <Ionicons name="time-outline" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <SubNavTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {renderActiveTab()}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    topNavHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Platform.OS === 'ios' ? 56 : STATUS_BAR_H + 16,
      paddingBottom: 10,
      paddingHorizontal: 16,
    },
    navTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.4,
    },
    navSubtitle: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    historyButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    cardWrapper: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 16,
    },
    cardInner: {
      padding: 16,
    },
    amountHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    amountLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    balancePill: {
      backgroundColor: theme.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    balanceText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMuted,
    },
    amountInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
    },
    currencyPrefix: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.textMuted,
      marginRight: 6,
    },
    amountInput: {
      flex: 1,
      fontSize: 34,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -1,
      padding: 0,
    },
    quickChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 12,
    },
    quickChip: {
      backgroundColor: theme.surfaceAlt,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: theme.border,
    },
    quickChipActive: {
      backgroundColor: theme.primarySoft,
      borderColor: theme.primary,
    },
    quickChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.text,
    },
    quickChipTextActive: {
      color: theme.primary,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 10,
      marginTop: 6,
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
    },
    viewAllLink: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    channelGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 8,
      marginBottom: 14,
    },
    channelCard: {
      width: '31%',
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.border,
    },
    channelCardSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primarySoft,
    },
    channelIconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    channelIconWrapperSelected: {
      backgroundColor: theme.surface,
    },
    channelLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
    },
    channelLabelSelected: {
      color: theme.primary,
      fontWeight: '700',
    },
    ctaWrapper: {
      paddingHorizontal: 16,
      marginBottom: 18,
    },
    recipientsRow: {
      paddingHorizontal: 16,
      gap: 12,
      paddingBottom: 8,
    },
    recipientItem: {
      alignItems: 'center',
      gap: 5,
      width: 54,
    },
    addRecipientItem: {
      alignItems: 'center',
      gap: 5,
      width: 54,
    },
    addRecipientCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recipientName: {
      fontSize: 10,
      fontWeight: '500',
      color: theme.textMuted,
      textAlign: 'center',
    },
    billsSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 14,
    },
    billsStat: {
      alignItems: 'center',
      gap: 4,
    },
    billsStatValue: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    billsStatLabel: {
      fontSize: 10,
      color: theme.textMuted,
    },
    dividerVertical: {
      width: 1,
      height: 28,
      backgroundColor: theme.border,
    },
    billsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 8,
    },
    billCard: {
      width: '48%',
      marginBottom: 4,
    },
    billCardInner: {
      padding: 12,
      alignItems: 'center',
      gap: 4,
    },
    billIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    billName: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.text,
    },
    billAmount: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
    },
    billDue: {
      fontSize: 10,
      color: theme.textMuted,
      marginBottom: 6,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.surface,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
      padding: 0,
    },
    addBenCtaRow: {
      paddingHorizontal: 16,
      marginVertical: 12,
    },
    beneficiaryList: {
      paddingHorizontal: 16,
    },
    cardList: {
      paddingHorizontal: 16,
      gap: 10,
    },
    goalCard: {
      marginBottom: 2,
    },
    goalCardInner: {
      padding: 14,
    },
    goalTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    goalIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalName: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    goalMeta: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 1,
    },
    progressBarTrack: {
      height: 5,
      backgroundColor: theme.surfaceAlt,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    loanCard: {
      marginBottom: 2,
    },
    loanCardInner: {
      padding: 14,
      gap: 12,
    },
    loanTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    loanTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    loanSub: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    loanMetricsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: theme.surfaceAlt,
      borderRadius: 8,
      padding: 10,
    },
    loanMetric: {
      alignItems: 'center',
    },
    loanMetricValue: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    loanMetricLabel: {
      fontSize: 9,
      color: theme.textMuted,
      marginTop: 2,
    },
  });
