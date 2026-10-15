// ============================================================================
// PARTIAL CRYPTO COMPONENT — Nordi Remittance Mobile
// 8 uniform equal-height crypto asset cards with TanStack Query caching
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { COINMARKETCAP_API_KEY } from '@env';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

export interface CryptoCoin {
  id: number;
  name: string;
  symbol: string;
  price: number;
  percentChange24h: number;
}

// 8 Top Crypto Assets Baseline Fallback
const DEFAULT_TOP_COINS: CryptoCoin[] = [
  { id: 1, name: 'Bitcoin', symbol: 'BTC', price: 68450.2, percentChange24h: 2.45 },
  { id: 1027, name: 'Ethereum', symbol: 'ETH', price: 2640.8, percentChange24h: 1.82 },
  { id: 5426, name: 'Solana', symbol: 'SOL', price: 154.6, percentChange24h: 4.12 },
  { id: 1839, name: 'BNB', symbol: 'BNB', price: 585.1, percentChange24h: -0.65 },
  { id: 52, name: 'XRP', symbol: 'XRP', price: 0.54, percentChange24h: -1.24 },
  { id: 74, name: 'Dogecoin', symbol: 'DOGE', price: 0.12, percentChange24h: 3.55 },
  { id: 2010, name: 'Cardano', symbol: 'ADA', price: 0.35, percentChange24h: -0.85 },
  { id: 5805, name: 'Avalanche', symbol: 'AVAX', price: 28.4, percentChange24h: 1.15 },
];

export const PartialCrypto: React.FC = () => {
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  // TanStack Query to cache data and prevent redundant refetching
  const { data: coins = DEFAULT_TOP_COINS, isLoading } = useQuery<CryptoCoin[]>({
    queryKey: ['crypto', 'top-listings-8'],
    queryFn: async () => {
      try {
        if (!COINMARKETCAP_API_KEY) return DEFAULT_TOP_COINS;

        const response = await axios.get(
          'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=8',
          {
            headers: {
              'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
            },
            timeout: 5000,
          }
        );

        if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data.slice(0, 8).map((coin: any) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            price: Number(coin.quote?.USD?.price || 0),
            percentChange24h: Number(coin.quote?.USD?.percent_change_24h || 0),
          }));
        }
      } catch {
        // Fallback gracefully on network / rate limit
      }
      return DEFAULT_TOP_COINS;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache to prevent constant refetching
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const formatPrice = (p: number) => {
    if (p >= 1000) {
      return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return `$${p.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      {/* ── Section Header with Drop/More Button ── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Crypto Assets</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Top 8</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => router.push('/screens/Homescreens/CryptoListScreen' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.moreText}>Market</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* ── 8 Equal-Height Cards Grid (4 columns x 2 rows) ── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {coins.slice(0, 8).map((coin) => {
            const isPositive = coin.percentChange24h >= 0;
            const changeColor = isPositive ? '#16a34a' : '#dc2626';

            return (
              <TouchableOpacity
                key={coin.id}
                style={styles.coinCard}
                onPress={() => router.push('/screens/Homescreens/CryptoListScreen' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Image
                    source={{
                      uri: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
                    }}
                    style={styles.coinImage}
                    defaultSource={{ uri: 'https://cdn-icons-png.flaticon.com/512/6001/6001368.png' }}
                  />
                  <Text style={styles.coinSymbol} numberOfLines={1}>
                    {coin.symbol}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.coinPrice} numberOfLines={1}>
                    {formatPrice(coin.price)}
                  </Text>

                  <View style={styles.changeRow}>
                    <Ionicons
                      name={isPositive ? 'arrow-up' : 'arrow-down'}
                      size={10}
                      color={changeColor}
                    />
                    <Text style={[styles.changeText, { color: changeColor }]}>
                      {Math.abs(coin.percentChange24h).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default PartialCrypto;

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
      paddingVertical: 8,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    titleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.3,
    },
    badge: {
      backgroundColor: theme.primarySoft || 'rgba(37,99,235,0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.primary,
    },
    moreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 2,
      paddingHorizontal: 4,
    },
    moreText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    loadingContainer: {
      height: 180,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 8,
    },
    coinCard: {
      width: '23.5%', // 4 cards per row with equal width
      height: 84, // Exact same height for all 8 cards
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 8,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    coinImage: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    coinSymbol: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.text,
      flex: 1,
    },
    cardBody: {
      gap: 2,
    },
    coinPrice: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.text,
    },
    changeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    changeText: {
      fontSize: 10,
      fontWeight: '600',
    },
  });
