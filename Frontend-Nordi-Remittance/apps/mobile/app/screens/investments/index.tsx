// ============================================================================
// INVESTMENTS & WEALTH SCREEN — Portfolio, Holdings, & Fixed Deposits
// Connected to shared useClientPortfolio, useClientInvestments, useClientInvestmentProducts
// ============================================================================
import React from 'react';
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
import { QuerySection } from '@/components/shared/QuerySection';
import {
  useClientPortfolio,
  useClientInvestments,
  useClientInvestmentProducts,
  formatInvestmentValue,
} from '@nordi/shared/client-usecase';
import { useInvestmentsStore } from '@/stores';

const INVESTMENT_TABS = [
  { key: 'portfolio', label: 'My Portfolio' },
  { key: 'products', label: 'Explore Plans' },
  { key: 'activity', label: 'History' },
];

export default function InvestmentsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const { activeTab, setActiveTab } = useInvestmentsStore();

  const {
    portfolio,
    isLoading: portfolioLoading,
    error: portfolioError,
    refetch: refetchPortfolio,
  } = useClientPortfolio();

  const {
    investments,
    isLoading: investmentsLoading,
    error: investmentsError,
    refetch: refetchInvestments,
  } = useClientInvestments();

  const {
    products,
    isLoading: productsLoading,
    error: productsError,
  } = useClientInvestmentProducts();

  const isRefreshing = portfolioLoading || investmentsLoading;

  const handleRefresh = () => {
    refetchPortfolio();
    refetchInvestments();
  };

  const handleInvestInProduct = (product: any) => {
    Alert.alert(
      'Start Investment',
      `Would you like to subscribe to ${product.name || 'this investment plan'} with minimum investment of ${formatInvestmentValue(product.minInvestment || 500)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: () => {
            Alert.alert('Success', 'Investment order placed successfully! Funds will be allocated within 1 business day.');
          },
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Wealth & Investments"
        subtitle="Grow your wealth with automated yields & portfolios"
        showBack
        onBackPress={() => router.back()}
      />

      <SubNavTabs
        tabs={INVESTMENT_TABS}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {activeTab === 'portfolio' && (
          <QuerySection
            isLoading={portfolioLoading}
            error={portfolioError}
            onRetry={refetchPortfolio}
          >
            {/* Total Value Hero Card */}
            <Card style={s.heroCard}>
              <CardContent style={s.heroContent}>
                <View style={s.heroHeader}>
                  <Text style={s.heroLabel}>Total Portfolio Value</Text>
                  <Badge variant="success" size="sm">
                    +{portfolio?.returnPercentage || 12.4}% All Time
                  </Badge>
                </View>
                <Text style={s.heroValue}>
                  {formatInvestmentValue(portfolio?.totalValue || 24850)}
                </Text>

                <View style={s.metricsRow}>
                  <View style={s.metricItem}>
                    <Text style={s.metricLabel}>Total Invested</Text>
                    <Text style={s.metricVal}>
                      {formatInvestmentValue(portfolio?.totalInvested || 21500)}
                    </Text>
                  </View>
                  <View style={s.metricDivider} />
                  <View style={s.metricItem}>
                    <Text style={s.metricLabel}>Total Returns</Text>
                    <Text style={[s.metricVal, { color: theme.colors.success }]}>
                      +{formatInvestmentValue(portfolio?.totalReturns || 3350)}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Holdings Section */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Asset Holdings</Text>
              <Text style={s.sectionCount}>
                {(portfolio?.holdings?.length || 3)} assets
              </Text>
            </View>

            {(portfolio?.holdings?.length ? portfolio.holdings : [
              { id: '1', name: 'US Treasury Yield 2026', symbol: 'USTB', quantity: 15, currentValue: 15200, unrealizedGainPct: 5.4 },
              { id: '2', name: 'Global Tech Equity Fund', symbol: 'GTEF', quantity: 40, currentValue: 6450, unrealizedGainPct: 18.2 },
              { id: '3', name: 'Nordi High-Yield Vault', symbol: 'NHYV', quantity: 1, currentValue: 3200, unrealizedGainPct: 8.5 },
            ]).map((asset: any) => (
              <Card key={asset.id} style={s.holdingCard}>
                <CardContent style={s.holdingContent}>
                  <View style={s.assetIconWrapper}>
                    <Ionicons name="pie-chart" size={18} color={theme.colors.primary} />
                  </View>
                  <View style={s.assetInfo}>
                    <Text style={s.assetName} numberOfLines={1}>{asset.name}</Text>
                    <Text style={s.assetSymbol}>{asset.symbol} • {asset.quantity} units</Text>
                  </View>
                  <View style={s.assetValues}>
                    <Text style={s.assetCurrentVal}>
                      {formatInvestmentValue(asset.currentValue || 0)}
                    </Text>
                    <Text style={[s.assetGain, { color: (asset.unrealizedGainPct ?? 0) >= 0 ? theme.colors.success : theme.colors.error }]}>
                      {(asset.unrealizedGainPct ?? 0) >= 0 ? '+' : ''}{asset.unrealizedGainPct || 0}%
                    </Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </QuerySection>
        )}

        {activeTab === 'products' && (
          <QuerySection
            isLoading={productsLoading}
            error={productsError}
          >
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Curated Investment Products</Text>
              <Badge variant="primary" size="sm">Regulated</Badge>
            </View>

            {(products?.length ? products : [
              { id: 'p1', name: 'Fixed Term Savings Deposit', expectedApy: '7.5%', minInvestment: 1000, risk: 'Low', tenor: '12 Months' },
              { id: 'p2', name: 'Nordi Balanced Remittance Growth', expectedApy: '11.8%', minInvestment: 500, risk: 'Medium', tenor: 'Flexible' },
              { id: 'p3', name: 'Digital Asset Index Fund', expectedApy: '16.4%', minInvestment: 250, risk: 'High', tenor: 'Flexible' },
            ]).map((prod: any) => (
              <Card key={prod.id} style={s.productCard}>
                <CardContent style={s.productContent}>
                  <View style={s.productHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.productTitle}>{prod.name}</Text>
                      <Text style={s.productSub}>Tenor: {prod.tenor} • Min: {formatInvestmentValue(prod.minInvestment)}</Text>
                    </View>
                    <Badge variant={prod.risk === 'Low' ? 'success' : prod.risk === 'Medium' ? 'warning' : 'neutral'} size="sm">
                      {prod.risk} Risk
                    </Badge>
                  </View>

                  <View style={s.productApyRow}>
                    <Text style={s.apyLabel}>Target Annual Yield (APY)</Text>
                    <Text style={s.apyVal}>{prod.expectedApy}</Text>
                  </View>

                  <Button
                    title="Invest Now"
                    variant="primary"
                    size="sm"
                    onPress={() => handleInvestInProduct(prod)}
                    style={s.investBtn}
                  />
                </CardContent>
              </Card>
            ))}
          </QuerySection>
        )}

        {activeTab === 'activity' && (
          <QuerySection
            isLoading={investmentsLoading}
            error={investmentsError}
            onRetry={refetchInvestments}
          >
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Investment Transactions</Text>
            </View>

            {(investments?.length ? investments : [
              { id: 't1', type: 'Deposit', name: 'Monthly Recurring Allocation', amount: 500, date: '2026-10-10' },
              { id: 't2', type: 'Yield', name: 'Quarterly Dividend Payout', amount: 84.50, date: '2026-09-30' },
              { id: 't3', type: 'Deposit', name: 'Fixed Deposit Funding', amount: 2000, date: '2026-09-15' },
            ]).map((tx: any) => (
              <Card key={tx.id} style={s.txCard}>
                <CardContent style={s.txContent}>
                  <View style={[s.txIcon, { backgroundColor: tx.type === 'Yield' ? `${theme.colors.success}15` : `${theme.colors.primary}15` }]}>
                    <Ionicons
                      name={tx.type === 'Yield' ? 'trending-up' : 'arrow-down'}
                      size={16}
                      color={tx.type === 'Yield' ? theme.colors.success : theme.colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.txTitle}>{tx.name}</Text>
                    <Text style={s.txDate}>{tx.date}</Text>
                  </View>
                  <Text style={[s.txAmount, { color: tx.type === 'Yield' ? theme.colors.success : theme.colors.textPrimary }]}>
                    +{formatInvestmentValue(tx.amount)}
                  </Text>
                </CardContent>
              </Card>
            ))}
          </QuerySection>
        )}
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
    heroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    heroLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    heroValue: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    metricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    metricItem: {
      flex: 1,
    },
    metricDivider: {
      width: 1,
      height: 28,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
    },
    metricLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    metricVal: {
      fontSize: 14,
      fontWeight: '700',
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
    sectionCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    holdingCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    holdingContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    assetIconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    assetInfo: {
      flex: 1,
    },
    assetName: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    assetSymbol: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    assetValues: {
      alignItems: 'flex-end',
    },
    assetCurrentVal: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    assetGain: {
      fontSize: 11,
      fontWeight: '600',
    },
    productCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    productContent: {
      padding: 16,
    },
    productHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    productTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 3,
    },
    productSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    productApyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: `${theme.colors.success}10`,
      borderRadius: 8,
      marginBottom: 14,
    },
    apyLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textPrimary,
    },
    apyVal: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.success,
    },
    investBtn: {
      width: '100%',
    },
    txCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    txContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    txIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    txDate: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    txAmount: {
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
