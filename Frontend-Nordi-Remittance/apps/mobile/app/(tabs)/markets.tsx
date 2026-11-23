// ============================================================================
// MARKETS SCREEN — Nordi Remittance Mobile
// Ultra-minimalist global markets hub: Crypto, Stocks, FX, and Funds
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { Icon } from '@/components/ui/Icon';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SPACING, FONT_SIZES, ICON_SIZES, RADIUS } from '@/constants/sizings';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: string;
  color: string;
}

const TABS = [
  { key: 'crypto', label: 'Crypto' },
  { key: 'stocks', label: 'Stocks & ETFs' },
  { key: 'forex', label: 'Forex' },
  { key: 'funds', label: 'Funds' },
];

const cryptoAssets: Asset[] = [
  { id: '1', symbol: 'BTC', name: 'Bitcoin', price: 67420, change: 2.4, volume: '$28.4B', color: '#f7931a' },
  { id: '2', symbol: 'ETH', name: 'Ethereum', price: 3520, change: 1.8, volume: '$12.1B', color: '#627eea' },
  { id: '3', symbol: 'SOL', name: 'Solana', price: 182, change: -3.2, volume: '$3.8B', color: '#9945ff' },
  { id: '4', symbol: 'BNB', name: 'BNB Chain', price: 580, change: 0.6, volume: '$1.9B', color: '#f3ba2f' },
  { id: '5', symbol: 'AVAX', name: 'Avalanche', price: 38.2, change: 4.7, volume: '$810M', color: '#e84142' },
];

const stockAssets: Asset[] = [
  { id: '1', symbol: 'AAPL', name: 'Apple Inc.', price: 226.50, change: 0.8, volume: '$4.2B', color: '#0071e3' },
  { id: '2', symbol: 'MSFT', name: 'Microsoft', price: 421.00, change: 1.2, volume: '$3.1B', color: '#00a2ed' },
  { id: '3', symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.30, change: 5.4, volume: '$8.9B', color: '#76b900' },
  { id: '4', symbol: 'TSLA', name: 'Tesla Motors', price: 248.90, change: -2.1, volume: '$6.4B', color: '#cc0000' },
];

const forexPairs = [
  { id: '1', pair: 'EUR/USD', rate: 1.0842, change: 0.12, high: 1.0860, low: 1.0820 },
  { id: '2', pair: 'GBP/USD', rate: 1.2634, change: -0.24, high: 1.2680, low: 1.2610 },
  { id: '3', pair: 'USD/NGN', rate: 1620.00, change: 0.85, high: 1630.00, low: 1615.00 },
  { id: '4', pair: 'USD/JPY', rate: 149.85, change: -0.08, high: 150.20, low: 149.50 },
];

export default function MarketsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const [activeTab, setActiveTab] = useState('crypto');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setRefreshing(false);
  };

  return (
    <AdaptiveScreen withTabBar={true} onRefresh={onRefresh} refreshing={refreshing}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerSubtitle}>GLOBAL EXCHANGE</Text>
          <Text style={styles.headerTitle}>Live Markets</Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/screens/forex/LiveRates')}
          activeOpacity={0.7}
        >
          <Icon name="Activity" size={ICON_SIZES.sm} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Market Portfolio Overview */}
      <Card style={styles.portfolioCard}>
        <CardContent style={styles.portfolioContent}>
          <View style={styles.portfolioTopRow}>
            <Text style={styles.portfolioLabel}>Aggregate Valuation</Text>
            <Badge variant="outline" size="sm">24h +3.4%</Badge>
          </View>
          <Text style={styles.portfolioValue}>$18,450.80</Text>
          <View style={styles.portfolioSubRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="TrendingUp" size={ICON_SIZES.nano} color={theme.success} />
              <Text style={[styles.pnlText, { color: theme.success }]}> +$608.20 Unrealized</Text>
            </View>
            <TouchableOpacity
              style={styles.tradeShortcutBtn}
              onPress={() => router.push('/screens/forex' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.tradeShortcutText}>Convert FX</Text>
              <Icon name="ArrowRight" size={ICON_SIZES.nano} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>

      {/* Segmented Filter Pills */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabPill,
                isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? { color: '#FFFFFF', fontWeight: '700' } : { color: theme.textMuted },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Market Ticker List */}
      <Card style={styles.listCard}>
        <CardContent style={{ paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md }}>
          {activeTab === 'crypto' &&
            cryptoAssets.map((asset, idx) => {
              const isLast = idx === cryptoAssets.length - 1;
              const isPositive = asset.change >= 0;
              return (
                <TouchableOpacity
                  key={asset.id}
                  style={[styles.assetRow, !isLast && styles.assetBorder]}
                  onPress={() => router.push('/screens/Homescreens/CryptoListScreen')}
                  activeOpacity={0.7}
                >
                  <View style={styles.assetLeft}>
                    <View style={[styles.symbolBox, { backgroundColor: `${asset.color}15` }]}>
                      <Text style={[styles.symbolText, { color: asset.color }]}>
                        {asset.symbol.slice(0, 3)}
                      </Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.assetName}>{asset.name}</Text>
                      <Text style={styles.assetVol}>{asset.volume} vol</Text>
                    </View>
                  </View>
                  <View style={styles.assetRight}>
                    <Text style={styles.priceText}>
                      ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                    <View
                      style={[
                        styles.changeBadge,
                        { backgroundColor: isPositive ? `${theme.success}15` : `${theme.danger}15` },
                      ]}
                    >
                      <Icon
                        name={isPositive ? 'TrendingUp' : 'TrendingDown'}
                        size={ICON_SIZES.nano}
                        color={isPositive ? theme.success : theme.danger}
                      />
                      <Text
                        style={[
                          styles.changeText,
                          { color: isPositive ? theme.success : theme.danger },
                        ]}
                      >
                        {isPositive ? '+' : ''}{asset.change}%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

          {activeTab === 'stocks' &&
            stockAssets.map((asset, idx) => {
              const isLast = idx === stockAssets.length - 1;
              const isPositive = asset.change >= 0;
              return (
                <TouchableOpacity
                  key={asset.id}
                  style={[styles.assetRow, !isLast && styles.assetBorder]}
                  onPress={() => router.push('/screens/investments' as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.assetLeft}>
                    <View style={[styles.symbolBox, { backgroundColor: `${asset.color}15` }]}>
                      <Text style={[styles.symbolText, { color: asset.color }]}>
                        {asset.symbol.slice(0, 4)}
                      </Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.assetName}>{asset.name}</Text>
                      <Text style={styles.assetVol}>{asset.volume} cap</Text>
                    </View>
                  </View>
                  <View style={styles.assetRight}>
                    <Text style={styles.priceText}>
                      ${asset.price.toFixed(2)}
                    </Text>
                    <View
                      style={[
                        styles.changeBadge,
                        { backgroundColor: isPositive ? `${theme.success}15` : `${theme.danger}15` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.changeText,
                          { color: isPositive ? theme.success : theme.danger },
                        ]}
                      >
                        {isPositive ? '+' : ''}{asset.change}%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

          {activeTab === 'forex' &&
            forexPairs.map((pair, idx) => {
              const isLast = idx === forexPairs.length - 1;
              const isPositive = pair.change >= 0;
              return (
                <TouchableOpacity
                  key={pair.id}
                  style={[styles.assetRow, !isLast && styles.assetBorder]}
                  onPress={() => router.push('/screens/forex/LiveRates')}
                  activeOpacity={0.7}
                >
                  <View style={styles.assetLeft}>
                    <View style={[styles.symbolBox, { backgroundColor: theme.primarySoft }]}>
                      <Icon name="ArrowRightLeft" size={ICON_SIZES.xs} color={theme.primary} />
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.assetName}>{pair.pair}</Text>
                      <Text style={styles.assetVol}>High: {pair.high} • Low: {pair.low}</Text>
                    </View>
                  </View>
                  <View style={styles.assetRight}>
                    <Text style={styles.priceText}>{pair.rate}</Text>
                    <View
                      style={[
                        styles.changeBadge,
                        { backgroundColor: isPositive ? `${theme.success}15` : `${theme.danger}15` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.changeText,
                          { color: isPositive ? theme.success : theme.danger },
                        ]}
                      >
                        {isPositive ? '+' : ''}{pair.change}%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

          {activeTab === 'funds' && (
            <View style={{ paddingVertical: SPACING.lg, alignItems: 'center' }}>
              <Icon name="PieChart" size={32} color={theme.textMuted} />
              <Text style={{ fontSize: FONT_SIZES.body, color: theme.textMuted, marginTop: 8 }}>
                Nordi Diversified Vaults are rebalancing.
              </Text>
              <TouchableOpacity
                style={{ marginTop: 12 }}
                onPress={() => router.push('/screens/investments/FixedIncome')}
              >
                <Text style={{ fontSize: FONT_SIZES.caption, color: theme.primary, fontWeight: '700' }}>
                  Explore Fixed Income →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </CardContent>
      </Card>
    </AdaptiveScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    topHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.lg,
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
    portfolioCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    portfolioContent: {
      padding: SPACING.md,
    },
    portfolioTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.xs,
    },
    portfolioLabel: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      fontWeight: '600',
    },
    portfolioValue: {
      fontSize: FONT_SIZES.hero,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.5,
      marginBottom: SPACING.xs,
    },
    portfolioSubRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pnlText: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '700',
    },
    tradeShortcutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    tradeShortcutText: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '700',
      color: theme.primary,
    },
    tabsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.md,
      gap: SPACING.xs,
    },
    tabPill: {
      flex: 1,
      paddingVertical: SPACING.xs + 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RADIUS.full,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tabLabel: {
      fontSize: FONT_SIZES.nano,
      fontWeight: '600',
    },
    listCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.xl,
    },
    assetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.sm,
    },
    assetBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    assetLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: SPACING.sm,
    },
    symbolBox: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.sm,
    },
    symbolText: {
      fontSize: FONT_SIZES.micro,
      fontWeight: '800',
    },
    metaCol: {
      flex: 1,
    },
    assetName: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      color: theme.text,
    },
    assetVol: {
      fontSize: FONT_SIZES.nano,
      color: theme.textMuted,
      marginTop: 2,
    },
    assetRight: {
      alignItems: 'flex-end',
    },
    priceText: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      color: theme.text,
    },
    changeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: RADIUS.sm,
      marginTop: 2,
      gap: 2,
    },
    changeText: {
      fontSize: FONT_SIZES.nano,
      fontWeight: '700',
    },
  });
