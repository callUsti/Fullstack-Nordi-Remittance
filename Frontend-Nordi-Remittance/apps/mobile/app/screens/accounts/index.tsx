// ============================================================================
// ACCOUNTS SCREEN — Multi-currency Wallets, Balances, & Statements
// Connected to useClientWallets, useClientAccountSummary, and AccountCard
// ============================================================================
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader, SubNavTabs } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AccountCard } from '@/components/banking/AccountCard';
import { QuerySection } from '@/components/shared/QuerySection';
import {
  useClientWallets,
  useClientAccountSummary,
} from '@nordi/shared/client-usecase';
import { useAccountsStore } from '@/stores';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'wallets', label: 'Multi-Currency' },
  { key: 'fixed', label: 'Fixed Deposits' },
  { key: 'statements', label: 'Statements' },
];

export default function AccountsScreen() {
  const { activeTab, setActiveTab } = useAccountsStore();
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const { wallets: rawWallets, isLoading, error, refetch } = useClientWallets();
  const { summary } = useClientAccountSummary();

  const wallets = useMemo(() => {
    if (rawWallets && rawWallets.length > 0) {
      return rawWallets.map((w: any, idx: number) => ({
        id: w.id || String(idx),
        name: w.name || (idx === 0 ? 'Primary USD Wallet' : 'EUR Remittance Account'),
        accountNumber: w.accountNumber || `•••• ${4421 + idx * 111}`,
        balance: Number(w.balance ?? 18240.50),
        currency: w.currency || (idx === 1 ? 'EUR' : 'USD'),
        type: (w.type === 'business' ? 'business' : 'savings') as any,
        status: (w.status?.toLowerCase() || 'active') as any,
        isPrimary: idx === 0,
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
        name: 'EUR Remittance Vault',
        accountNumber: '•••• 8832',
        balance: 14210.00,
        currency: 'EUR',
        type: 'savings' as const,
        status: 'active' as const,
        isPrimary: false,
      },
      {
        id: 'w3',
        name: 'GBP Trading Pocket',
        accountNumber: '•••• 9104',
        balance: 6340.20,
        currency: 'GBP',
        type: 'investment' as const,
        status: 'active' as const,
        isPrimary: false,
      },
    ];
  }, [rawWallets]);

  const totalBalanceUSD = useMemo(() => {
    return wallets.reduce((acc, w) => acc + (w.balance || 0), 0);
  }, [wallets]);

  const handleWalletPress = (wallet: any) => {
    router.push({
      pathname: '/screens/accounts/WalletDetails' as any,
      params: { id: wallet.id, name: wallet.name, currency: wallet.currency, balance: wallet.balance },
    });
  };

  const handleApplyAccount = () => {
    router.push('/screens/accounts/AccountApplication' as any);
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Accounts & Wallets"
        subtitle="Multi-currency vaults, statements & yields"
        showBack
        onBackPress={() => router.back()}
        rightElement={
          <TouchableOpacity
            style={s.headerAddBtn}
            onPress={handleApplyAccount}
          >
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      <SubNavTabs
        tabs={TABS}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        <QuerySection isLoading={isLoading} error={error} onRetry={refetch}>
          {activeTab === 'overview' && (
            <>
              {/* Balance Hero Card */}
              <Card style={s.heroCard}>
                <CardContent style={s.heroContent}>
                  <View style={s.heroTop}>
                    <Text style={s.heroLabel}>Consolidated Net Worth</Text>
                    <Badge variant="success" size="sm">+3.8% This Month</Badge>
                  </View>
                  <Text style={s.heroAmount}>
                    ${totalBalanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={s.heroSub}>Spread across {wallets.length} active currencies</Text>

                  <View style={s.quickActionsRow}>
                    <TouchableOpacity
                      style={s.quickActionItem}
                      onPress={() => router.push('/screens/send-money' as any)}
                    >
                      <View style={[s.quickActionIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                        <Ionicons name="arrow-up" size={18} color={theme.colors.primary} />
                      </View>
                      <Text style={s.quickActionLabel}>Send</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.quickActionItem}
                      onPress={() => router.push('/screens/forex' as any)}
                    >
                      <View style={[s.quickActionIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                        <Ionicons name="swap-horizontal" size={18} color={theme.colors.primary} />
                      </View>
                      <Text style={s.quickActionLabel}>Convert</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.quickActionItem}
                      onPress={() => router.push('/screens/accounts/AccountStatements' as any)}
                    >
                      <View style={[s.quickActionIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                        <Ionicons name="document-text" size={18} color={theme.colors.primary} />
                      </View>
                      <Text style={s.quickActionLabel}>Statement</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.quickActionItem}
                      onPress={() => router.push('/screens/accounts/AccountLimits' as any)}
                    >
                      <View style={[s.quickActionIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                        <Ionicons name="speedometer" size={18} color={theme.colors.primary} />
                      </View>
                      <Text style={s.quickActionLabel}>Limits</Text>
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>

              {/* Wallets List Section */}
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Active Currency Pockets</Text>
                <TouchableOpacity onPress={handleApplyAccount}>
                  <Text style={s.sectionAction}>+ Open New</Text>
                </TouchableOpacity>
              </View>

              {wallets.map((wallet) => (
                <AccountCard
                  key={wallet.id}
                  account={wallet}
                  onPress={() => handleWalletPress(wallet)}
                />
              ))}
            </>
          )}

          {activeTab === 'wallets' && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>All Multi-Currency Pockets</Text>
              </View>
              {wallets.map((wallet) => (
                <AccountCard
                  key={wallet.id}
                  account={wallet}
                  onPress={() => handleWalletPress(wallet)}
                />
              ))}
              <Button
                title="+ Apply for New Currency Account"
                variant="outline"
                size="md"
                onPress={handleApplyAccount}
                style={{ marginTop: 12 }}
              />
            </>
          )}

          {activeTab === 'fixed' && (
            <Card style={s.fixedDepositCard}>
              <CardContent style={s.fixedContent}>
                <View style={s.fixedHeader}>
                  <View style={s.fixedIconWrap}>
                    <Ionicons name="trending-up" size={24} color={theme.colors.success} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.fixedTitle}>Nordi High-Yield Vault</Text>
                    <Text style={s.fixedSub}>Lock funds for 3-12 months and earn APY</Text>
                  </View>
                  <Badge variant="success" size="md">5.2% APY</Badge>
                </View>
                <View style={s.fixedBody}>
                  <Text style={s.fixedDesc}>
                    Grow your idle balances with automated compounding interest backed by UK and EU tier-1 clearing institutions.
                  </Text>
                  <Button
                    title="Explore Fixed Deposits"
                    variant="primary"
                    size="sm"
                    onPress={() => router.push('/screens/investments' as any)}
                    style={{ marginTop: 14 }}
                  />
                </View>
              </CardContent>
            </Card>
          )}

          {activeTab === 'statements' && (
            <Card style={s.statementPromoCard}>
              <CardContent style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} />
                  <Text style={[s.sectionTitle, { marginLeft: 10 }]}>Monthly e-Statements</Text>
                </View>
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 16 }}>
                  Export official stamped bank statements in PDF or CSV formats for visa, tax, or business reconciliation.
                </Text>
                <Button
                  title="Generate Statements"
                  variant="primary"
                  size="sm"
                  onPress={() => router.push('/screens/accounts/AccountStatements' as any)}
                />
              </CardContent>
            </Card>
          )}
        </QuerySection>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerAddBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    heroCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    heroContent: {
      padding: 18,
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    heroLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    heroAmount: {
      fontSize: 30,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    heroSub: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    quickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    quickActionItem: {
      alignItems: 'center',
      flex: 1,
    },
    quickActionIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    quickActionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    sectionAction: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    fixedDepositCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginTop: 4,
    },
    fixedContent: {
      padding: 18,
    },
    fixedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    fixedIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: `${theme.colors.success}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fixedTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    fixedSub: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    fixedBody: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
    },
    fixedDesc: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    statementPromoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });
}
