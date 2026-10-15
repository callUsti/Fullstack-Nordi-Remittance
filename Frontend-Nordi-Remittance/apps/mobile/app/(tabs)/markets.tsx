// ============================================================================
// MARKETS SCREEN — Crypto + Investments + Forex hub with top sub-nav
// ============================================================================
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { SubNavTabs } from '@/components/shared/ScreenHeader';

const TABS = [
  { key: 'crypto', label: 'Crypto' },
  { key: 'stocks', label: 'Stocks & ETFs' },
  { key: 'forex', label: 'Forex' },
  { key: 'funds', label: 'Mutual Funds' },
];

const STATUS_BAR_H = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

interface Asset {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: string;
  mktCap: string;
  color: string;
}

const cryptoAssets: Asset[] = [
  { id: 1, symbol: 'BTC', name: 'Bitcoin', price: 67_420, change: 2.4, volume: '$28.4B', mktCap: '$1.3T', color: '#f7931a' },
  { id: 2, symbol: 'ETH', name: 'Ethereum', price: 3_520, change: 1.8, volume: '$12.1B', mktCap: '$420B', color: '#627eea' },
  { id: 3, symbol: 'SOL', name: 'Solana', price: 182, change: -3.2, volume: '$3.8B', mktCap: '$78B', color: '#9945ff' },
  { id: 4, symbol: 'BNB', name: 'BNB', price: 580, change: 0.6, volume: '$1.9B', mktCap: '$86B', color: '#f3ba2f' },
  { id: 5, symbol: 'ADA', name: 'Cardano', price: 0.48, change: -1.1, volume: '$620M', mktCap: '$17B', color: '#0033ad' },
  { id: 6, symbol: 'AVAX', name: 'Avalanche', price: 38.2, change: 4.7, volume: '$810M', mktCap: '$15B', color: '#e84142' },
];

const stockAssets: Asset[] = [
  { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 226.50, change: 0.8, volume: '$4.2B', mktCap: '$3.4T', color: '#555' },
  { id: 2, symbol: 'MSFT', name: 'Microsoft', price: 421.00, change: 1.2, volume: '$3.1B', mktCap: '$3.1T', color: '#00a2ed' },
  { id: 3, symbol: 'NVDA', name: 'NVIDIA', price: 875.30, change: 5.4, volume: '$8.9B', mktCap: '$2.1T', color: '#76b900' },
  { id: 4, symbol: 'TSLA', name: 'Tesla', price: 248.90, change: -2.1, volume: '$6.4B', mktCap: '$790B', color: '#cc0000' },
];

const forexPairs = [
  { pair: 'EUR/USD', rate: 1.0842, change: 0.12, bid: 1.0840, ask: 1.0844 },
  { pair: 'GBP/USD', rate: 1.2634, change: -0.24, bid: 1.2631, ask: 1.2637 },
  { pair: 'USD/NGN', rate: 1620, change: 0.85, bid: 1618, ask: 1622 },
  { pair: 'USD/JPY', rate: 149.85, change: -0.08, bid: 149.83, ask: 149.87 },
  { pair: 'USD/GHS', rate: 14.25, change: 0.31, bid: 14.23, ask: 14.27 },
];

const mutualFunds = [
  { id: 1, name: 'Nordi Growth Fund', nav: 24.85, change: 1.4, category: 'Equity', risk: 'High', returns1y: '18.4%' },
  { id: 2, name: 'Nordi Balanced Fund', nav: 18.20, change: 0.6, category: 'Hybrid', risk: 'Medium', returns1y: '12.1%' },
  { id: 3, name: 'Nordi Debt Fund', nav: 12.45, change: 0.2, category: 'Debt', risk: 'Low', returns1y: '7.8%' },
];

export default function MarketsScreen() {
  const [activeTab, setActiveTab] = useState('crypto');
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const renderAssetRow = (asset: Asset) => (
    <TouchableOpacity key={asset.id} style={s.assetRow}>
      <View style={[s.assetSymbolBox, { backgroundColor: `${asset.color}20` }]}>
        <Text style={[s.assetSymbol, { color: asset.color }]}>{asset.symbol.slice(0, 3)}</Text>
      </View>
      <View style={s.assetInfo}>
        <Text style={s.assetName} numberOfLines={1}>{asset.name}</Text>
        <Text style={s.assetVol}>Vol {asset.volume}</Text>
      </View>
      <View style={s.assetRight}>
        <Text style={s.assetPrice}>${asset.price.toLocaleString('en-US', { minimumFractionDigits: asset.price < 1 ? 4 : 2 })}</Text>
        <View style={[s.changePill, { backgroundColor: asset.change >= 0 ? '#dcfce7' : '#fee2e2' }]}>
          <Ionicons name={asset.change >= 0 ? 'trending-up' : 'trending-down'} size={10} color={asset.change >= 0 ? '#16a34a' : '#dc2626'} />
          <Text style={[s.changeText, { color: asset.change >= 0 ? '#16a34a' : '#dc2626' }]}>
            {Math.abs(asset.change)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCrypto = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Portfolio Mini-Card */}
      <LinearGradient colors={['#1e1b4b', '#312e81']} style={s.portfolioCard}>
        <Text style={s.portLabel}>Crypto Portfolio</Text>
        <Text style={s.portValue}>$12,840.50</Text>
        <View style={s.portRow}>
          <Text style={s.portSub}>Today's P&L</Text>
          <Text style={s.portPnl}>+$324.20 (2.6%)</Text>
        </View>
        <View style={s.portActions}>
          <TouchableOpacity style={s.portBtn} onPress={() => router.push('/screens/Transactions/AccessCrypto' as any)}>
            <Ionicons name="arrow-up" size={14} color="#fff" />
            <Text style={s.portBtnTxt}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.portBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="arrow-down" size={14} color="#fff" />
            <Text style={s.portBtnTxt}>Sell</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.portBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="swap-horizontal" size={14} color="#fff" />
            <Text style={s.portBtnTxt}>Convert</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Market List */}
      <View style={s.listHeader}>
        <Text style={s.listHeaderTxt}>Markets</Text>
        <TouchableOpacity onPress={() => router.push('/screens/Homescreens/CryptoListScreen' as any)}>
          <Text style={[s.seeAll, { color: theme.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={s.list}>{cryptoAssets.map(renderAssetRow)}</View>
    </ScrollView>
  );

  const renderStocks = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={s.comingCard}>
        <LinearGradient colors={['#0f766e', '#0d9488']} style={s.comingGrad}>
          <Ionicons name="trending-up" size={36} color="rgba(255,255,255,0.9)" />
          <Text style={s.comingTitle}>Stocks & ETFs</Text>
          <Text style={s.comingSub}>Coming soon to Nordi. Invest in global markets.</Text>
        </LinearGradient>
      </View>
      <View style={s.listHeader}>
        <Text style={s.listHeaderTxt}>Top Stocks</Text>
      </View>
      <View style={s.list}>{stockAssets.map(renderAssetRow)}</View>
    </ScrollView>
  );

  const renderForex = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={s.listHeader}>
        <Text style={s.listHeaderTxt}>Live Exchange Rates</Text>
        <TouchableOpacity onPress={() => router.push('/screens/Transactions/ConvertFx' as any)}>
          <Text style={[s.seeAll, { color: theme.primary }]}>Convert</Text>
        </TouchableOpacity>
      </View>
      <View style={s.list}>
        {forexPairs.map(pair => (
          <TouchableOpacity key={pair.pair} style={s.forexRow}>
            <View style={[s.assetSymbolBox, { backgroundColor: theme.primarySoft }]}>
              <Text style={[s.assetSymbol, { color: theme.primary, fontSize: 9 }]}>{pair.pair.split('/')[0]}</Text>
            </View>
            <View style={s.assetInfo}>
              <Text style={s.assetName}>{pair.pair}</Text>
              <Text style={s.assetVol}>Bid: {pair.bid} · Ask: {pair.ask}</Text>
            </View>
            <View style={s.assetRight}>
              <Text style={s.assetPrice}>{pair.rate.toLocaleString()}</Text>
              <View style={[s.changePill, { backgroundColor: pair.change >= 0 ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={[s.changeText, { color: pair.change >= 0 ? '#16a34a' : '#dc2626' }]}>
                  {pair.change >= 0 ? '+' : ''}{pair.change}%
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderFunds = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={s.listHeader}>
        <Text style={s.listHeaderTxt}>Mutual Funds</Text>
      </View>
      <View style={s.list}>
        {mutualFunds.map(fund => (
          <View key={fund.id} style={s.fundCard}>
            <View style={s.fundTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.fundName} numberOfLines={1}>{fund.name}</Text>
                <View style={s.fundMeta}>
                  <View style={[s.chip, { backgroundColor: theme.primarySoft }]}>
                    <Text style={[s.chipTxt, { color: theme.primary }]}>{fund.category}</Text>
                  </View>
                  <View style={[s.chip, { backgroundColor: fund.risk === 'High' ? '#fee2e2' : fund.risk === 'Low' ? '#dcfce7' : '#fef3c7' }]}>
                    <Text style={[s.chipTxt, { color: fund.risk === 'High' ? '#dc2626' : fund.risk === 'Low' ? '#16a34a' : '#d97706' }]}>{fund.risk} Risk</Text>
                  </View>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.fundNav}>NAV ${fund.nav}</Text>
                <Text style={s.fundReturn1y}>{fund.returns1y} (1Y)</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    if (activeTab === 'stocks') return renderStocks();
    if (activeTab === 'forex') return renderForex();
    if (activeTab === 'funds') return renderFunds();
    return renderCrypto();
  };

  return (
    <View style={s.container}>
      {/* Markets Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Markets</Text>
          <Text style={s.headerSub}>Live global markets</Text>
        </View>
        <TouchableOpacity style={[s.searchIcon, { backgroundColor: theme.surface }]}>
          <Ionicons name="search" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>
      <SubNavTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      {renderContent()}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: Platform.OS === 'ios' ? 56 : STATUS_BAR_H + 20,
      paddingBottom: 12, paddingHorizontal: 20,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },
    headerSub: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    searchIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    portfolioCard: { margin: 16, borderRadius: 20, padding: 20 },
    portLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
    portValue: { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 4, letterSpacing: -1 },
    portRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    portSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
    portPnl: { fontSize: 12, color: '#86efac', fontWeight: '600' },
    portActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
    portBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingVertical: 8, gap: 4,
    },
    portBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
    listHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4,
    },
    listHeaderTxt: { fontSize: 15, fontWeight: '700', color: theme.text },
    seeAll: { fontSize: 13, fontWeight: '600' },
    list: { paddingHorizontal: 16 },
    assetRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.surface, borderRadius: 12,
      padding: 12, marginBottom: 8, gap: 12,
    },
    assetSymbolBox: {
      width: 42, height: 42, borderRadius: 21,
      alignItems: 'center', justifyContent: 'center',
    },
    assetSymbol: { fontSize: 11, fontWeight: '800' },
    assetInfo: { flex: 1 },
    assetName: { fontSize: 14, fontWeight: '600', color: theme.text },
    assetVol: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
    assetRight: { alignItems: 'flex-end', gap: 4 },
    assetPrice: { fontSize: 14, fontWeight: '700', color: theme.text },
    changePill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
    changeText: { fontSize: 11, fontWeight: '700' },
    forexRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.surface, borderRadius: 12,
      padding: 12, marginBottom: 8, gap: 12,
    },
    fundCard: {
      backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 10,
    },
    fundTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    fundName: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 6 },
    fundMeta: { flexDirection: 'row', gap: 6 },
    fundNav: { fontSize: 14, fontWeight: '700', color: theme.text },
    fundReturn1y: { fontSize: 12, color: '#16a34a', fontWeight: '600', marginTop: 2 },
    chip: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
    chipTxt: { fontSize: 10, fontWeight: '700' },
    comingCard: { margin: 16 },
    comingGrad: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
    comingTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    comingSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  });
