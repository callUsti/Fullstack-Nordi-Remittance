// ============================================================================
// SECTION COMPONENT — React Native version
// Consistent page section wrapper with optional fade-in animation.
// Replaces framer-motion + HTML <section> with ScrollView-friendly Views.
// ============================================================================

import React, { useEffect } from 'react';
import { View, Text, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@nordi/shared/constants/colors';
import { DURATIONS, EASINGS } from '@core/animation/presets';

// ========================
// TYPES
// ========================
export type SectionSize       = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type SectionBackground = 'white' | 'light' | 'dark' | 'primary' | 'gradient' | 'transparent';

export interface SectionProps {
  children: React.ReactNode;
  size?: SectionSize;
  background?: SectionBackground;
  noPadding?: boolean;
  fullHeight?: boolean;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ========================
// SIZE STYLES (max-width in dp)
// ========================
const SIZE_MAX_WIDTHS: Record<SectionSize, number | '100%'> = {
  sm:   768,
  md:   1024,
  lg:   1440,
  xl:   1640,
  full: '100%',
};

// ========================
// BACKGROUND STYLES
// ========================
const BG_STYLES: Record<SectionBackground, ViewStyle> = {
  white:       { backgroundColor: colors.neutral[0] },
  light:       { backgroundColor: colors.neutral[50] },
  dark:        { backgroundColor: colors.neutral[900] },
  primary:     { backgroundColor: colors.primary[500] },
  gradient:    { backgroundColor: colors.primary[600] }, // use LinearGradient wrapper externally
  transparent: { backgroundColor: 'transparent' },
};

// ========================
// COMPONENT
// ========================
export const Section: React.FC<SectionProps> = ({
  children,
  size = 'lg',
  background = 'transparent',
  noPadding = false,
  fullHeight = false,
  animate = false,
  style,
}) => {
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate) {
      opacity.value = withTiming(1, { duration: DURATIONS.slow, easing: EASINGS.smooth });
    }
  }, [animate]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        BG_STYLES[background],
        { width: '100%' },
        fullHeight && { flex: 1 },
        animStyle,
        style,
      ]}
    >
      <View
        style={{
          width: '100%',
          maxWidth: SIZE_MAX_WIDTHS[size] as any,
          alignSelf: 'center',
          paddingHorizontal: noPadding ? 0 : 16,
          paddingVertical: noPadding ? 0 : 24,
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
};

Section.displayName = 'Section';

// ========================
// SECTION HEADER
// ========================
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  centered?: boolean;
  badge?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  description,
  centered = true,
  badge,
  action,
  style,
}) => {
  return (
    <View
      style={[
        { marginBottom: 32 },
        centered && { alignItems: 'center' },
        style,
      ]}
    >
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge.toUpperCase()}</Text>
        </View>
      )}
      {subtitle && (
        <Text style={[styles.subtitle, centered && { textAlign: 'center' }]}>
          {subtitle.toUpperCase()}
        </Text>
      )}
      <View
        style={[
          { gap: 12 },
          centered ? { alignItems: 'center' } : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
        ]}
      >
        <Text style={[styles.title, centered && { textAlign: 'center' }]}>
          {title}
        </Text>
        {action && <View style={{ flexShrink: 0 }}>{action}</View>}
      </View>
      {description && (
        <Text
          style={[
            styles.description,
            centered && { textAlign: 'center', alignSelf: 'center', maxWidth: 480 },
          ]}
        >
          {description}
        </Text>
      )}
    </View>
  );
};

// ========================
// STYLES
// ========================
const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[100],
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[600],
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[500],
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[900],
    lineHeight: 32,
    flex: 1,
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    color: colors.neutral[600],
    lineHeight: 22,
  },
});

export default Section;
