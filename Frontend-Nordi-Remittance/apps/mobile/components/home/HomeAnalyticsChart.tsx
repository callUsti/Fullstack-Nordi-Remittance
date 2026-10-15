// ============================================================================
// HOME ANALYTICS & SPENDING CHART COMPONENT — Nordi Remittance Mobile
// Interactive Spending Analytics & Trend charts inspired by Website Client Dashboard
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import {
  useClientSpending,
  SPENDING_FILTER_OPTIONS,
} from '@nordi/shared/client-usecase';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

interface HomeAnalyticsChartProps {
  initiallyExpanded?: boolean;
}

export const HomeAnalyticsChart: React.FC<HomeAnalyticsChartProps> = ({
  initiallyExpanded = false,
}) => {
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  // Client Spending domain hook shared from @nordi/shared
  const {
    categories,
    trends,
    totalSpending,
    activeFilter,
    setActiveFilter,
    isLoading,
    isTrendLoading,
  } = useClientSpending();

  // Baseline data when backend trends are still warming up
  const chartLabels = trends.length > 0
    ? trends.slice(-6).map((t) => t.month)
    : ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

  const chartDataPoints = trends.length > 0
    ? trends.slice(-6).map((t) => Math.max(t.spent, 10))
    : [340, 520, 480, 810, 690, 940];

  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(totalSpending > 0 ? totalSpending : 3780);

  // Top spending categories
  const topCategories = categories.length > 0
    ? categories.slice(0, 4)
    : [
        { category: 'Dining & Food', amount: 840, color: '#4f46e5' },
        { category: 'Shopping', amount: 620, color: '#06b6d4' },
        { category: 'Entertainment', amount: 310, color: '#f59e0b' },
        { category: 'Bills & Utilities', amount: 260, color: '#10b981' },
      ];

  const totalCatSum = topCategories.reduce((acc, c) => acc + c.amount, 0) || 1;

  const chartConfig = {
    backgroundColor: theme.surface,
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: () => theme.textMuted,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '4',
      stroke: theme.border,
      strokeWidth: 1,
    },
  };

  return (
    <View style={styles.container}>
      {/* ── Nudge / Teaser Card ── */}
      <TouchableOpacity
        style={styles.nudgeCard}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <View style={styles.nudgeLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="pie-chart-outline" size={18} color={theme.primary} />
          </View>
          <View>
            <View style={styles.badgeRow}>
              <Text style={styles.nudgeTitle}>Spending Analytics</Text>
              <View style={styles.miniBadge}>
                <Text style={styles.miniBadgeText}>INSIGHTS</Text>
              </View>
            </View>
            <Text style={styles.nudgeSubtitle}>
              {isExpanded
                ? 'Tap to minimize charts'
                : `Total spent this month: ${formattedTotal}`}
            </Text>
          </View>
        </View>

        <View style={styles.nudgeRight}>
          <Text style={styles.nudgeCtaText}>
            {isExpanded ? 'Hide' : 'See Charts'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.primary}
          />
        </View>
      </TouchableOpacity>

      {/* ── Expanded Chart Dashboard ── */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Period Filter Tabs */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Timeline:</Text>
            <View style={styles.filterTabs}>
              {SPENDING_FILTER_OPTIONS.map((opt) => {
                const isActive = activeFilter === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.filterTab,
                      isActive && styles.filterTabActive,
                    ]}
                    onPress={() => setActiveFilter(opt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        isActive && styles.filterTabTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Trend Line Chart */}
          <View style={styles.chartWrapper}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartHeaderTitle}>Cash Flow Trend</Text>
              <Text style={styles.chartTotal}>{formattedTotal}</Text>
            </View>

            {isTrendLoading ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : (
              <LineChart
                data={{
                  labels: chartLabels,
                  datasets: [
                    {
                      data: chartDataPoints,
                      color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                      strokeWidth: 2.5,
                    },
                  ],
                }}
                width={CHART_WIDTH}
                height={160}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines
                withOuterLines={false}
                withVerticalLines={false}
              />
            )}
          </View>

          {/* Category Distribution Progress Bars */}
          <View style={styles.categoriesSection}>
            <Text style={styles.categoriesHeader}>Category Breakdown</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <View style={styles.categoryList}>
                {topCategories.map((item) => {
                  const pct = Math.round((item.amount / totalCatSum) * 100);
                  return (
                    <View key={item.category} style={styles.categoryItem}>
                      <View style={styles.categoryItemHeader}>
                        <View style={styles.catLeft}>
                          <View
                            style={[
                              styles.catDot,
                              { backgroundColor: item.color },
                            ]}
                          />
                          <Text style={styles.catName}>{item.category}</Text>
                        </View>
                        <Text style={styles.catAmount}>
                          ${item.amount.toLocaleString()} ({pct}%)
                        </Text>
                      </View>

                      {/* Micro Progress Bar */}
                      <View style={styles.progressBarBackground}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor: item.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default HomeAnalyticsChart;

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
      marginVertical: 6,
    },
    nudgeCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    nudgeLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primarySoft || 'rgba(37,99,235,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    nudgeTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.3,
    },
    miniBadge: {
      backgroundColor: 'rgba(37,99,235,0.12)',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    miniBadgeText: {
      fontSize: 8,
      fontWeight: '800',
      color: theme.primary,
      letterSpacing: 0.3,
    },
    nudgeSubtitle: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 1,
    },
    nudgeRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingLeft: 6,
    },
    nudgeCtaText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    expandedContent: {
      marginTop: 8,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    filterLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMuted,
    },
    filterTabs: {
      flexDirection: 'row',
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterTab: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    filterTabActive: {
      backgroundColor: theme.primary,
    },
    filterTabText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.textMuted,
    },
    filterTabTextActive: {
      color: '#ffffff',
    },
    chartWrapper: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    chartHeaderTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    chartTotal: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.primary,
    },
    chart: {
      marginVertical: 4,
      borderRadius: 12,
      marginLeft: -16,
    },
    loaderBox: {
      height: 160,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoriesSection: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 10,
      gap: 8,
    },
    categoriesHeader: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    categoryList: {
      gap: 8,
    },
    categoryItem: {
      gap: 4,
    },
    categoryItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    catLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    catDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    catName: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.text,
    },
    catAmount: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMuted,
    },
    progressBarBackground: {
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 2,
    },
  });
