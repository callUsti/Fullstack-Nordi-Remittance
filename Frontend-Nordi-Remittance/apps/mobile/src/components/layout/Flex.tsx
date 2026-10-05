// ============================================================================
// FLEX COMPONENT — React Native version
// Flexible box layout utility using RN flexbox.
// Removes all framer-motion / HTML references.
// ============================================================================

import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';

// ========================
// TYPES
// ========================
export type FlexDirection   = 'row' | 'row-reverse' | 'column' | 'column-reverse';
export type FlexAlign       = 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
export type FlexJustify     = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
export type FlexWrap        = 'wrap' | 'nowrap' | 'wrap-reverse';
export type FlexGap         = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface FlexProps {
  children: React.ReactNode;
  direction?: FlexDirection;
  align?: FlexAlign;
  justify?: FlexJustify;
  wrap?: FlexWrap;
  gap?: FlexGap;
  flex?: number;
  style?: StyleProp<ViewStyle>;
}

// ========================
// GAP VALUES (dp)
// ========================
const GAP_VALUES: Record<FlexGap, number> = {
  none: 0,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
};

// ========================
// COMPONENT
// ========================
export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  align = 'stretch',
  justify = 'flex-start',
  wrap = 'nowrap',
  gap = 'none',
  flex,
  style,
}) => {
  const viewStyle: ViewStyle = {
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap,
    gap: GAP_VALUES[gap],
    ...(flex !== undefined ? { flex } : {}),
  };

  return <View style={[viewStyle, style]}>{children}</View>;
};

Flex.displayName = 'Flex';

// ========================
// SPACER COMPONENT
// ========================
export interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  axis?: 'horizontal' | 'vertical';
}

const SPACER_SIZES: Record<NonNullable<SpacerProps['size']>, number> = {
  xs:  8,
  sm:  16,
  md:  24,
  lg:  32,
  xl:  48,
  '2xl': 64,
  '3xl': 96,
};

export const Spacer: React.FC<SpacerProps> = ({ size = 'md', axis = 'vertical' }) => {
  const style: ViewStyle =
    axis === 'vertical'
      ? { height: SPACER_SIZES[size] }
      : { width: SPACER_SIZES[size] };
  return <View style={style} accessibilityElementsHidden aria-hidden />;
};

// ========================
// DIVIDER COMPONENT
// ========================
export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const DIVIDER_SPACING: Record<NonNullable<DividerProps['spacing']>, number> = {
  none: 0,
  sm:   8,
  md:   16,
  lg:   24,
};

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  spacing = 'md',
  color = '#E2E8F0',
  style,
}) => {
  const sp = DIVIDER_SPACING[spacing];
  const dividerStyle: ViewStyle =
    orientation === 'horizontal'
      ? { height: 1, width: '100%', backgroundColor: color, marginVertical: sp }
      : { width: 1, height: '100%', backgroundColor: color, marginHorizontal: sp };

  return <View accessibilityRole="none" style={[dividerStyle, style]} />;
};

export default Flex;
