// ============================================================================
// GRID COMPONENT — React Native version
// Responsive grid layout using flex-wrap.
// Replaces framer-motion + HTML divs with plain RN Views.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, StyleProp, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { DURATIONS, EASINGS } from '@core/animation/presets';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ========================
// TYPES
// ========================
export type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 12;
export type GridGap  = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface GridProps {
  children: React.ReactNode;
  cols?: GridCols;
  gap?: GridGap;
  rowGap?: GridGap;
  colGap?: GridGap;
  animate?: boolean;
  stagger?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ========================
// GAP VALUES (dp)
// ========================
const GAP_VALUES: Record<GridGap, number> = {
  none: 0,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
};

// ========================
// ANIMATED GRID ITEM
// ========================
interface AnimatedItemProps {
  children: React.ReactNode;
  index: number;
  itemWidth: number | string;
  colGapValue: number;
  animate: boolean;
}

const AnimatedGridItem: React.FC<AnimatedItemProps> = ({
  children,
  index,
  itemWidth,
  colGapValue,
  animate,
}) => {
  const opacity    = useSharedValue(animate ? 0 : 1);
  const translateY = useSharedValue(animate ? 20 : 0);

  useEffect(() => {
    if (animate) {
      const delay = index * 80;
      opacity.value    = withDelay(delay, withTiming(1, { duration: DURATIONS.normal, easing: EASINGS.smoothOut }));
      translateY.value = withDelay(delay, withTiming(0, { duration: DURATIONS.normal, easing: EASINGS.smoothOut }));
    }
  }, [animate, index]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: itemWidth as any,
          marginBottom: colGapValue,
        },
        animStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ========================
// GRID COMPONENT
// ========================
export const Grid: React.FC<GridProps> = ({
  children,
  cols = 2,
  gap = 'md',
  rowGap,
  colGap,
  animate = false,
  stagger = true,
  style,
}) => {
  const gapValue    = GAP_VALUES[gap];
  const rowGapValue = rowGap ? GAP_VALUES[rowGap] : gapValue;
  const colGapValue = colGap ? GAP_VALUES[colGap] : gapValue;

  // Calculate item width to achieve desired columns
  // itemWidth = (100% - gaps) / cols
  const containerWidth = SCREEN_WIDTH - 32; // approximate, accounting for screen padding
  const totalGapWidth  = colGapValue * (cols - 1);
  const itemWidth      = (containerWidth - totalGapWidth) / cols;

  const childArray = React.Children.toArray(children);

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: gapValue,
        },
        style,
      ]}
    >
      {animate && stagger
        ? childArray.map((child, index) => (
            <AnimatedGridItem
              key={index}
              index={index}
              itemWidth={itemWidth}
              colGapValue={rowGapValue}
              animate
            >
              {child}
            </AnimatedGridItem>
          ))
        : childArray.map((child, index) => (
            <View key={index} style={{ width: itemWidth }}>
              {child}
            </View>
          ))}
    </View>
  );
};

Grid.displayName = 'Grid';

// ========================
// GRID ITEM — explicit column span helper
// ========================
export interface GridItemProps {
  children: React.ReactNode;
  /** Fraction of the parent Grid row (0–1), e.g. 0.5 = half width */
  widthFraction?: number;
  style?: StyleProp<ViewStyle>;
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  widthFraction,
  style,
}) => (
  <View
    style={[
      widthFraction ? { width: `${widthFraction * 100}%` as any } : { flex: 1 },
      style,
    ]}
  >
    {children}
  </View>
);

GridItem.displayName = 'GridItem';

export default Grid;
