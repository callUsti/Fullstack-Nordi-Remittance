// ============================================================================
// REUSABLE SKELETON COMPONENTS — Banking loading placeholders (React Native)
// Uses react-native-reanimated for the shimmer sweep animation.
// ============================================================================

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@nordi/shared/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SHIMMER_WIDTH = SCREEN_WIDTH;

// ========================
// BASE SKELETON BLOCK
// ========================
interface SkeletonBlockProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const translateX = useSharedValue(-SHIMMER_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(SHIMMER_WIDTH, { duration: 1500, easing: Easing.linear }),
        withTiming(-SHIMMER_WIDTH, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.neutral[200],
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255,255,255,0.55)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: SHIMMER_WIDTH }}
        />
      </Animated.View>
    </View>
  );
};

// ========================
// PAGE HEADER SKELETON
// ========================
export const PageHeaderSkeleton: React.FC = () => (
  <View style={{ marginBottom: 24 }}>
    <SkeletonBlock width={200} height={28} borderRadius={6} style={{ marginBottom: 8 }} />
    <SkeletonBlock width={280} height={16} borderRadius={6} />
  </View>
);

// ========================
// STATS CARD SKELETON
// ========================
export const StatsCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
      <SkeletonBlock width={40} height={40} borderRadius={10} />
      <SkeletonBlock width={56} height={20} borderRadius={6} />
    </View>
    <SkeletonBlock width={120} height={28} borderRadius={6} style={{ marginBottom: 6 }} />
    <SkeletonBlock width={90} height={16} borderRadius={6} />
  </View>
);

export const StatsGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <View style={styles.grid}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={styles.gridHalf}>
        <StatsCardSkeleton />
      </View>
    ))}
  </View>
);

// ========================
// ACCOUNT CARD SKELETON
// ========================
export const AccountCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <View style={[styles.row, { marginBottom: 16 }]}>
      <SkeletonBlock width={48} height={48} borderRadius={12} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBlock width={140} height={18} borderRadius={6} style={{ marginBottom: 6 }} />
        <SkeletonBlock width={90} height={14} borderRadius={6} />
      </View>
      <SkeletonBlock width={60} height={22} borderRadius={20} />
    </View>
    <SkeletonBlock width={130} height={30} borderRadius={6} style={{ marginBottom: 8 }} />
    <SkeletonBlock width={180} height={14} borderRadius={6} />
    <View style={[styles.row, { marginTop: 16, gap: 8 }]}>
      <SkeletonBlock width={90} height={36} borderRadius={8} />
      <SkeletonBlock width={90} height={36} borderRadius={8} />
    </View>
  </View>
);

export const AccountListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={{ gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => (
      <AccountCardSkeleton key={i} />
    ))}
  </View>
);

// ========================
// TRANSACTION ROW SKELETON
// ========================
export const TransactionRowSkeleton: React.FC = () => (
  <View
    style={[
      styles.row,
      {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral[100],
        gap: 12,
      },
    ]}
  >
    <SkeletonBlock width={40} height={40} borderRadius={20} />
    <View style={{ flex: 1 }}>
      <SkeletonBlock width={140} height={14} borderRadius={6} style={{ marginBottom: 6 }} />
      <SkeletonBlock width={100} height={12} borderRadius={6} />
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <SkeletonBlock width={72} height={18} borderRadius={6} style={{ marginBottom: 4 }} />
      <SkeletonBlock width={54} height={12} borderRadius={6} />
    </View>
  </View>
);

export const TransactionListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <View style={styles.card}>
    <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
      <SkeletonBlock width={150} height={20} borderRadius={6} />
      <SkeletonBlock width={100} height={32} borderRadius={8} />
    </View>
    {Array.from({ length: count }).map((_, i) => (
      <TransactionRowSkeleton key={i} />
    ))}
  </View>
);

// ========================
// CREDIT CARD SKELETON
// ========================
export const CreditCardSkeleton: React.FC = () => (
  <View
    style={{
      borderRadius: 16,
      padding: 24,
      height: 192,
      backgroundColor: colors.neutral[300],
      overflow: 'hidden',
    }}
  >
    <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 32 }]}>
      <SkeletonBlock width={48} height={32} borderRadius={6} />
      <SkeletonBlock width={56} height={22} borderRadius={6} />
    </View>
    <SkeletonBlock width={200} height={22} borderRadius={6} style={{ marginBottom: 16 }} />
    <View style={[styles.row, { justifyContent: 'space-between' }]}>
      <SkeletonBlock width={90} height={14} borderRadius={6} />
      <SkeletonBlock width={60} height={14} borderRadius={6} />
    </View>
  </View>
);

// ========================
// TABLE SKELETON
// ========================
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => (
  <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: colors.neutral[0] }}>
    {/* Header */}
    <View
      style={[
        styles.row,
        {
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.neutral[200],
          backgroundColor: colors.neutral[50],
          gap: 12,
        },
      ]}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBlock key={i} height={14} style={{ flex: 1 }} />
      ))}
    </View>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.row,
          {
            padding: 16,
            borderBottomWidth: i < rows - 1 ? 1 : 0,
            borderBottomColor: colors.neutral[100],
            gap: 12,
          },
        ]}
      >
        {Array.from({ length: cols }).map((_, j) => (
          <SkeletonBlock
            key={j}
            height={14}
            style={j === 0 ? { width: 32 } : { flex: 1 }}
          />
        ))}
      </View>
    ))}
  </View>
);

// ========================
// FORM SKELETON
// ========================
export const FormFieldSkeleton: React.FC = () => (
  <View style={{ marginBottom: 16 }}>
    <SkeletonBlock width={100} height={14} borderRadius={6} style={{ marginBottom: 8 }} />
    <SkeletonBlock height={44} borderRadius={8} />
  </View>
);

export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <View style={styles.card}>
    <SkeletonBlock width={160} height={22} borderRadius={6} style={{ marginBottom: 24 }} />
    {Array.from({ length: fields }).map((_, i) => (
      <FormFieldSkeleton key={i} />
    ))}
    <SkeletonBlock height={48} borderRadius={8} style={{ marginTop: 24 }} />
  </View>
);

// ========================
// CHART SKELETON
// ========================
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 200 }) => (
  <View style={styles.card}>
    <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
      <SkeletonBlock width={140} height={20} borderRadius={6} />
      <View style={[styles.row, { gap: 8 }]}>
        <SkeletonBlock width={56} height={32} borderRadius={8} />
        <SkeletonBlock width={56} height={32} borderRadius={8} />
      </View>
    </View>
    <SkeletonBlock height={height} borderRadius={8} />
  </View>
);

// ========================
// DETAIL PAGE SKELETON
// ========================
export const DetailPageSkeleton: React.FC = () => (
  <View style={{ gap: 16 }}>
    <PageHeaderSkeleton />
    <StatsGridSkeleton count={3} />
    <TransactionListSkeleton />
    <ChartSkeleton height={160} />
  </View>
);

// ========================
// FULL PAGE SKELETON
// ========================
export const FullPageSkeleton: React.FC = () => (
  <View style={{ flex: 1, padding: 20, gap: 16 }}>
    <PageHeaderSkeleton />
    <StatsGridSkeleton />
    <TransactionListSkeleton count={4} />
    <ChartSkeleton />
  </View>
);

// ========================
// STYLES
// ========================
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridHalf: {
    width: '48%',
  },
});
