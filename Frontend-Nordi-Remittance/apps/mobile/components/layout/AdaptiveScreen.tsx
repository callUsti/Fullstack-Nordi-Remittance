// ============================================================================
// ADAPTIVE SCREEN COMPONENT — Nordi Remittance Mobile
// Ultra-adaptive wrapper for Notches, Dynamic Islands, Bottom Tab Bars,
// Flips, Folds, Tablets / iPads, and Multi-Form Factors with Smooth Scrolling
// ============================================================================

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  RefreshControl,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { DURATIONS, EASINGS } from '@/core/animation/Animation';

export interface AdaptiveScreenProps {
  children: React.ReactNode;
  /** Whether the screen is inside the main tabs layout with floating/absolute bottom tab bar */
  withTabBar?: boolean;
  /** Additional bottom padding override */
  extraBottomPadding?: number;
  /** Fixed top header component (e.g., ScreenHeader or AppBar) placed outside ScrollView */
  header?: React.ReactNode;
  /** Sticky header component placed inside ScrollView */
  stickyHeaderIndices?: number[];
  /** Optional pull to refresh handler */
  onRefresh?: () => Promise<void> | void;
  /** Is refresh in progress */
  refreshing?: boolean;
  /** Style for outer screen view */
  style?: ViewStyle;
  /** Style for inner scroll content */
  contentContainerStyle?: ViewStyle;
  /** Ref to the internal ScrollView */
  scrollViewRef?: React.RefObject<ScrollView | null>;
  /** Disable scrolling */
  scrollEnabled?: boolean;
  /** Enable KeyboardAvoidingView */
  keyboardAvoiding?: boolean;
  /** Max content width for Tablets and Unfolded Folds (default: 680) */
  maxContentWidth?: number;
}

export const AdaptiveScreen: React.FC<AdaptiveScreenProps> = ({
  children,
  withTabBar = false,
  extraBottomPadding = 0,
  header,
  stickyHeaderIndices,
  onRefresh,
  refreshing = false,
  style,
  contentContainerStyle,
  scrollViewRef,
  scrollEnabled = true,
  keyboardAvoiding = Platform.OS === 'ios',
  maxContentWidth = 680,
}) => {
  const theme = useMobileTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Screen device classifications for flips, folds, and tablets
  const isSmallDevice = width < 360; // Flip closed or compact phone
  const isTabletOrFold = width >= 600; // iPad, Android Tablet, or Galaxy Fold unfolded

  // Smooth entrance animation
  const opacity = useSharedValue(0);
  React.useEffect(() => {
    opacity.value = withTiming(1, {
      duration: DURATIONS.normal,
      easing: EASINGS.smooth,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Accurate notch / status bar top padding
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 12 : 20);

  // Tab bar clearance: tab bar is ~70dp on Android and ~90dp on iOS
  const tabBarHeight = withTabBar ? (Platform.OS === 'ios' ? 88 : 72) : 0;
  const bottomInset = insets.bottom + tabBarHeight + extraBottomPadding + (withTabBar ? 12 : 24);

  // Responsive horizontal constraints
  const horizontalPadding = isSmallDevice ? 10 : isTabletOrFold ? 24 : 16;

  const content = (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {/* Optional Pinned Top Header */}
      {header && (
        <View
          style={[
            styles.pinnedHeader,
            {
              paddingTop: topInset,
              backgroundColor: theme.background,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.responsiveContainer,
              { maxWidth: maxContentWidth, paddingHorizontal: horizontalPadding },
            ]}
          >
            {header}
          </View>
        </View>
      )}

      {/* Main Adaptive Scroll Content */}
      <ScrollView
        ref={scrollViewRef as any}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="normal"
        bounces={true}
        overScrollMode="never"
        stickyHeaderIndices={stickyHeaderIndices}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressViewOffset={header ? 20 : topInset}
            />
          ) : undefined
        }
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: header ? 8 : topInset,
            paddingBottom: bottomInset,
          },
          contentContainerStyle,
        ]}
      >
        <View
          style={[
            styles.responsiveContainer,
            {
              maxWidth: maxContentWidth,
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          {children}
        </View>
      </ScrollView>
    </Animated.View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }, style]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
};

export default AdaptiveScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pinnedHeader: {
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  responsiveContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
});
