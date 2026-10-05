// ============================================================================
// CONTAINER COMPONENT — React Native version
// Max-width wrapper with responsive horizontal padding.
// Replaces framer-motion + HTML div with Animated.View + StyleSheet.
// ============================================================================

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { DURATIONS, EASINGS } from '@core/animation/presets';

// ========================
// TYPES
// ========================
export type ContainerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface ContainerProps {
  children: React.ReactNode;
  size?: ContainerSize;
  noPadding?: boolean;
  centered?: boolean;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ========================
// MAX-WIDTH MAP (approx. Tailwind equivalents in dp)
// ========================
const MAX_WIDTHS: Record<ContainerSize, number | '100%'> = {
  xs:   320,
  sm:   576,
  md:   768,
  lg:   1024,
  xl:   1440,
  '2xl': 1640,
  full: '100%',
};

// ========================
// COMPONENT
// ========================
export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'xl',
  noPadding = false,
  centered = true,
  animate = false,
  style,
}) => {
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate) {
      opacity.value = withTiming(1, {
        duration: DURATIONS.normal,
        easing: EASINGS.smooth,
      });
    }
  }, [animate]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const containerStyle: ViewStyle = {
    width: '100%',
    maxWidth: MAX_WIDTHS[size] as any,
    alignSelf: centered ? 'center' : 'flex-start',
    paddingHorizontal: noPadding ? 0 : 16,
  };

  return (
    <Animated.View style={[containerStyle, animStyle, style]}>
      {children}
    </Animated.View>
  );
};

Container.displayName = 'Container';

export default Container;
