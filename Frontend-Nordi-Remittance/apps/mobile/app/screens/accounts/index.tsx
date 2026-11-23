// ============================================================================
// ACCOUNTS SCREEN — Multi-currency Wallets, Balances, & Facilities Hub
// Connected to useClientWallets, useClientAccountSummary, useClientAccountApplications, useClientCreditScore
// ============================================================================
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader, SubNavTabs } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { AccountCard } from '@/components/banking/AccountCard';
import { QuerySection } from '@/components/shared/QuerySection';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import {
  useClientWallets,
  useClientAccountSummary,
  useClientAccountApplications,
  useClientCreditScore,
  useCancelApplication,
} from '@nordi/shared/client-usecase';
import { useAccountsStore } from '@/stores';
import { ICON_SIZES, SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'wallets', label: 'Currency Pockets' },
  { key: 'applications', label: 'Applications' },
  { key: 'statements', label: 'Statements & Limits' },
];

export default function AccountsScreen() {
  const { activeTab, setActiveTab } = useAccountsStore();
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const { wallets: rawWallets, isLoading, error, refetch } = useClientWallets();
  const { summary, recentTransactions } = useClientAccountSummary();
  const { applications, refetch: refetchApplications } = useClientAccountApplications();
  const { score: creditScore } = useClientCreditScore();
  const cancelMutation = useCancelApplication();

  const wallets = useMemo(() => {
    if (rawWallets && rawWallets.length > 0) {
      return rawWallets.map((w: any, idx: number) => ({
        id: w.id || String(idx),
        name: w.notes || (w.isPrimary ? 'Primary Wallet' : `${w.primaryCurrency} Pocket`),
        accountNumber: w.walletNumber || `•••• ${4421 + idx * 111}`,
        balance: Number(w.primaryCurrencyBalance ?? w.rawTotalBalance ?? 0),
        currency: w.primaryCurrency || 'USD',
        type: (w.type === 'business' ? 'business' : 'savings') as any,
        status: (w.status?.toLowerCase() || 'active') as any,
        isPrimary: Boolean(w.isPrimary),
      }));
    }

    return [
      {
        id: 'w1',
        name: 'USD Main Wallet',
        accountNumber: '•••• 4421',
        balance: 24850.75,
        currency: 'USD',
        type: 'checking' as const,
        status: 'active' as const,
        isPrimary: true,
      },
      {
        id: 'w2',
        name: 'EUR Remittance Pocket',
        accountNumber: '•••• 8832',
        balance: 14210.0,
        currency: 'EUR',
        type: 'savings' as const,
        status: 'active' as const,
        isPrimary: false,
      },
      {
        id: 'w3',
        name: 'GBP Trading Pocket',
        accountNumber: '•••• 9104',
        balance: 6340.2,
        currency: 'GBP',
        type: 'business' as const,
        status: 'active' as const,
        isPrimary: false,
      },
    ];
  }, [rawWallets]);

  const totalBalance = useMemo(() => {
    if (summary.totalBalance > 0) return summary.totalBalance;
    return wallets.reduce((acc, w) => acc + (w.balance || 0), 0);
  }, [summary.totalBalance, wallets]);

  const handleWalletPress = (wallet: any) => {
    router.push({
      pathname: '/screens/accounts/WalletDetails' as any,
      params: {
        id: wallet.id,
        name: wallet.name,
        currency: wallet.currency,
        balance: wallet.balance,
      },
    });
  };

  const handleCancelApp = (appId: string) => {
    Alert.alert('Cancel Application', 'Are you sure you want to cancel this application?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => {
          cancelMutation.mutate(appId, {
            onSuccess: () => refetchApplications(),
          });
        },
      },
    ]);
  };

  return (
    <AdaptiveScreen
      onRefresh={() => {
        refetch();
        refetchApplications();
      }}
      refreshing={isLoading}
      header={
        <ScreenHeader
          title="Accounts & Wallets"
          subtitle="Multi-currency IBANs, Vaults, & Facilities"
          rightAction={
            <TouchableOpacity
              onPress={() => router.push('/screens/accounts/CreateWallet' as any)}
              style={s.headerAddBtn}
              accessibilityLabel="Open New Currency Pocket"
              activeOpacity={0.7}
            >
              <Icon name="PlusCircle" size={ICON_SIZES.lg} color={theme.primary} />
            </TouchableOpacity>
          }
        />
      }
    >
      {/* Total Balance Hero Card */}
      <Card style={s.heroCard}>
        <CardContent style={s.heroContent}>
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroLabel}>TOTAL NET WORTH (EST. USD)</Text>
              <Text style={s.heroBalance}>
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <TouchableOpacity
              style={s.creditBadgeBox}
              onPress={() => router.push('/screens/accounts/AccountLimits' as any)}
              activeOpacity={0.8}
            >
              <Text style={s.creditBadgeLabel}>CREDIT SCORE</Text>
              <View style={s.creditScoreRow}>
                <Icon name="ShieldCheck" size={14} color={theme.success} />
                <Text style={s.creditScoreVal}>{creditScore}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Monthly Stats Strip */}
          <View style={s.statsStrip}>
            <View style={s.statCol}>
              <Text style={s.statLabel}>MONTH INFLOW</Text>
              <Text style={[s.statVal, { color: theme.success }]}>
                +${(summary.incoming || 4820).toLocaleString()}
              </Text>
            </View>
            <View style={s.statCol}>
              <Text style={s.statLabel}>MONTH OUTFLOW</Text>
              <Text style={[s.statVal, { color: theme.danger }]}>
                -${(summary.outgoing || 1950).toLocaleString()}
              </Text>
            </View>
            <View style={s.statCol}>
              <Text style={s.statLabel}>ACTIVE POCKETS</Text>
              <Text style={s.statVal}>{wallets.length}</Text>
            </View>
          </View>

          {/* Quick Action Navigation Grid */}
          <View style={s.quickActionsGrid}>
            <TouchableOpacity
              style={s.quickActionBtn}
              onPress={() => router.push('/screens/accounts/CreateWallet' as any)}
              activeOpacity={0.7}
            >
              <View style={s.actionIconBox}>
                <Icon name="Wallet" size={ICON_SIZES.sm} color={theme.primary} />
              </View>
              <Text style={s.actionText}>New Pocket</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.quickActionBtn}
              onPress={() => router.push('/screens/accounts/AccountApplication' as any)}
              activeOpacity={0.7}
            >
              <View style={s.actionIconBox}>
                <Icon name="PiggyBank" size={ICON_SIZES.sm} color={theme.success} />
              </View>
              <Text style={s.actionText}>Apply Vault</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.quickActionBtn}
              onPress={() => router.push('/screens/accounts/AccountLimits' as any)}
              activeOpacity={0.7}
            >
              <View style={s.actionIconBox}>
                <Icon name="Shield" size={ICON_SIZES.sm} color={theme.warning} />
              </View>
              <Text style={s.actionText}>Velocity Caps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.quickActionBtn}
              onPress={() => router.push('/screens/accounts/AccountStatements' as any)}
              activeOpacity={0.7}
            >
              <View style={s.actionIconBox}>
                <Icon name="Receipt" size={ICON_SIZES.sm} color={theme.primary} />
              </View>
              <Text style={s.actionText}>Statements</Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>

      {/* Sub Navigation Tabs */}
      <View style={s.subnavWrap}>
        <SubNavTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      {/* TAB 1: OVERVIEW & WALLETS */}
      {(activeTab === 'overview' || activeTab === 'wallets') && (
        <View style={s.tabSection}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>
              Your Currency Pockets ({wallets.length})
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/screens/accounts/CreateWallet' as any)}
              activeOpacity={0.7}
            >
              <Text style={s.linkText}>+ Add Currency</Text>
            </TouchableOpacity>
          </View>

          <QuerySection query={{ isLoading, error } as any}>
            <View style={s.walletsList}>
              {wallets.map((wallet) => (
                <AccountCard
                  key={wallet.id}
                  account={wallet}
                  onPress={() => handleWalletPress(wallet)}
                  onViewDetails={() => handleWalletPress(wallet)}
                />
              ))}
            </View>
          </QuerySection>

          {/* Pending Applications Banner if any */}
          {applications.some((a: any) => a.status === 'pending') && (
            <Card style={s.pendingBanner}>
              <CardContent style={s.pendingContent}>
                <Icon name="Clock" size={ICON_SIZES.md} color={theme.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={s.pendingTitle}>Underwriting Review in Progress</Text>
                  <Text style={s.pendingSub}>
                    You have pending high-yield vault applications awaiting activation.
                  </Text>
                </View>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setActiveTab('applications')}
                >
                  View
                </Button>
              </CardContent>
            </Card>
          )}
        </View>
      )}

      {/* TAB 2: APPLICATIONS */}
      {activeTab === 'applications' && (
        <View style={s.tabSection}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Account Facilities & Vaults</Text>
            <Button
              variant="primary"
              size="sm"
              onPress={() => router.push('/screens/accounts/AccountApplication' as any)}
            >
              + New Application
            </Button>
          </View>

          {applications.length === 0 ? (
            <Card style={s.emptyCard}>
              <CardContent style={s.emptyContent}>
                <Icon name="PiggyBank" size={ICON_SIZES.xl} color={theme.textMuted} />
                <Text style={s.emptyTitle}>No formal facilities open</Text>
                <Text style={s.emptySub}>
                  Earn up to 6.1% APY on fixed-term deposits or request commercial overdraft
                  protection for your business.
                </Text>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => router.push('/screens/accounts/AccountApplication' as any)}
                  style={{ marginTop: SPACING.sm }}
                >
                  Explore Facilities
                </Button>
              </CardContent>
            </Card>
          ) : (
            applications.map((app: any) => {
              const appId = app._id || app.id;
              const isPending = app.status === 'pending';
              const variant =
                app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning';
              return (
                <Card key={appId} style={s.appCard}>
                  <CardContent style={s.appCardContent}>
                    <View style={s.appCardTop}>
                      <View style={s.appCardLeft}>
                        <Icon
                          name={app.type === 'savings' ? 'PiggyBank' : 'Lock'}
                          size={ICON_SIZES.md}
                          color={theme.primary}
                        />
                        <View>
                          <Text style={s.appCardTitle}>
                            {app.type === 'savings'
                              ? 'High Yield Savings'
                              : app.type === 'fixed_deposit'
                              ? `Fixed Deposit (${app.termMonths} Mo)`
                              : 'Current Account'}
                          </Text>
                          <Text style={s.appCardSub}>
                            {app.currency} · {app.nickname || 'Standard'}
                          </Text>
                        </View>
                      </View>
                      <Badge variant={variant} size="sm">
                        {app.status?.toUpperCase() || 'PENDING'}
                      </Badge>
                    </View>

                    {isPending && (
                      <View style={s.appActionRow}>
                        <Button
                          variant="danger"
                          size="sm"
                          onPress={() => handleCancelApp(appId)}
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
      )}

      {/* TAB 3: STATEMENTS & LIMITS */}
      {activeTab === 'statements' && (
        <View style={s.tabSection}>
          <Card style={s.hubNavCard}>
            <CardContent style={s.hubNavContent}>
              <TouchableOpacity
                style={s.hubNavItem}
                onPress={() => router.push('/screens/accounts/AccountStatements' as any)}
                activeOpacity={0.7}
              >
                <View style={s.hubNavIcon}>
                  <Icon name="Receipt" size={ICON_SIZES.md} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.hubNavTitle}>Official Bank Statements</Text>
                  <Text style={s.hubNavSub}>
                    Generate stamped PDF or CSV ledger extracts for tax & proof of funds.
                  </Text>
                </View>
                <Icon name="ChevronRight" size={ICON_SIZES.sm} color={theme.textMuted} />
              </TouchableOpacity>

              <View style={s.divider} />

              <TouchableOpacity
                style={s.hubNavItem}
                onPress={() => router.push('/screens/accounts/AccountLimits' as any)}
                activeOpacity={0.7}
              >
                <View style={s.hubNavIcon}>
                  <Icon name="Shield" size={ICON_SIZES.md} color={theme.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.hubNavTitle}>Regulatory Velocity Limits</Text>
                  <Text style={s.hubNavSub}>
                    Track remaining daily & monthly caps, ATM limits, and credit rating score.
                  </Text>
                </View>
                <Icon name="ChevronRight" size={ICON_SIZES.sm} color={theme.textMuted} />
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>
      )}
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    headerAddBtn: {
      padding: SPACING.xs,
    },
    heroCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    heroContent: {
      padding: SPACING.md,
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.md,
    },
    heroLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.textMuted,
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    heroBalance: {
      fontSize: 32,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: -0.5,
    },
    creditBadgeBox: {
      backgroundColor: `${theme.success}10`,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: `${theme.success}30`,
      alignItems: 'center',
    },
    creditBadgeLabel: {
      fontSize: 8,
      fontWeight: '800',
      color: theme.textMuted,
      marginBottom: 2,
    },
    creditScoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    creditScoreVal: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '800',
      color: theme.success,
    },
    statsStrip: {
      flexDirection: 'row',
      backgroundColor: theme.background,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xs,
      marginBottom: SPACING.md,
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.textMuted,
      marginBottom: 2,
    },
    statVal: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '800',
      color: theme.text,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      gap: SPACING.xs,
    },
    quickActionBtn: {
      flex: 1,
      backgroundColor: theme.background,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: 2,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      gap: 4,
    },
    actionIconBox: {
      width: 28,
      height: 28,
      borderRadius: RADIUS.sm,
      backgroundColor: `${theme.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.text,
    },
    subnavWrap: {
      marginBottom: SPACING.md,
    },
    tabSection: {
      gap: SPACING.sm,
      marginBottom: SPACING['3xl'],
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.xs,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '700',
      color: theme.text,
    },
    linkText: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '700',
      color: theme.primary,
    },
    walletsList: {
      gap: SPACING.sm,
    },
    pendingBanner: {
      backgroundColor: `${theme.warning}10`,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: `${theme.warning}30`,
      marginTop: SPACING.sm,
    },
    pendingContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      padding: SPACING.md,
    },
    pendingTitle: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '700',
      color: theme.text,
    },
    pendingSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
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
      marginBottom: SPACING.xs,
    },
    appCardContent: {
      padding: SPACING.md,
    },
    appCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    appCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    appCardTitle: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '700',
      color: theme.text,
    },
    appCardSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
    },
    appActionRow: {
      marginTop: SPACING.sm,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: SPACING.xs,
    },
    hubNavCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    hubNavContent: {
      paddingHorizontal: SPACING.sm,
    },
    hubNavItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xs,
      gap: SPACING.sm,
    },
    hubNavIcon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      backgroundColor: `${theme.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hubNavTitle: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    hubNavSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      lineHeight: 15,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
    },
  });
}
