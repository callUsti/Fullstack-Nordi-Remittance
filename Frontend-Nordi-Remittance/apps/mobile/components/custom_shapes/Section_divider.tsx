// ============================================================================
// CUSTOM SHAPES — React Native SVG components
// Replaces HTML <svg> with react-native-svg equivalents.
// ============================================================================

import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '@nordi/shared/constants/colors';

// ========================
// SECTION DIVIDER
// Decorative wave that separates page sections.
// ========================
interface SectionDividerProps {
  fill?: string;
  /** Flip the wave vertically */
  flip?: boolean;
  style?: StyleProp<ViewStyle>;
  width?: number;
  height?: number;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  fill = colors.neutral[50],
  flip = false,
  style,
  width = 390,
  height = 60,
}) => (
  <View
    style={[
      { width: '100%', height, overflow: 'hidden' },
      flip && { transform: [{ scaleY: -1 }] },
      style,
    ]}
  >
    <Svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <Path
        d={`M0,${height} C${width * 0.35},0 ${width * 0.65},0 ${width},${height} Z`}
        fill={fill}
      />
    </Svg>
  </View>
);

// ========================
// WAVE DIVIDER
// Smooth sine wave transition between two sections.
// ========================
interface WaveDividerProps {
  topColor?: string;
  bottomColor?: string;
  style?: StyleProp<ViewStyle>;
  height?: number;
}

export const WaveDivider: React.FC<WaveDividerProps> = ({
  topColor = colors.primary[600],
  bottomColor = colors.neutral[50],
  style,
  height = 80,
}) => (
  <View style={[{ width: '100%', height, backgroundColor: bottomColor }, style]}>
    <Svg
      width="100%"
      height={height}
      viewBox="0 0 390 80"
      preserveAspectRatio="none"
    >
      <Path
        d="M0,0 C100,80 290,80 390,0 L390,0 L0,0 Z"
        fill={topColor}
      />
    </Svg>
  </View>
);

// ========================
// CURVED BOTTOM
// Gives a card or hero section a curved bottom edge.
// ========================
interface CurvedBottomProps {
  fill?: string;
  style?: StyleProp<ViewStyle>;
  height?: number;
  curveDepth?: number;
}

export const CurvedBottom: React.FC<CurvedBottomProps> = ({
  fill = colors.neutral[50],
  style,
  height = 48,
  curveDepth = 40,
}) => (
  <View style={[{ width: '100%', height, overflow: 'hidden' }, style]}>
    <Svg
      width="100%"
      height={height}
      viewBox={`0 0 390 ${height}`}
      preserveAspectRatio="none"
    >
      <Path
        d={`M0,0 Q195,${curveDepth} 390,0 L390,${height} L0,${height} Z`}
        fill={fill}
      />
    </Svg>
  </View>
);

// ========================
// GRADIENT DIVIDER
// A horizontal gradient strip as a visual separator.
// ========================
interface GradientDividerProps {
  startColor?: string;
  endColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const GradientDivider: React.FC<GradientDividerProps> = ({
  startColor = colors.primary[400],
  endColor   = colors.accent[500],
  height = 3,
  style,
}) => (
  <View style={[{ width: '100%', height, overflow: 'hidden' }, style]}>
    <Svg width="100%" height={height} viewBox="0 0 390 3" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={startColor} stopOpacity="1" />
          <Stop offset="100%" stopColor={endColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Path d="M0,0 L390,0 L390,3 L0,3 Z" fill="url(#grad)" />
    </Svg>
  </View>
);

// ========================
// DIAGONAL CUT
// Creates a diagonal section transition.
// ========================
interface DiagonalCutProps {
  fill?: string;
  direction?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  height?: number;
}

export const DiagonalCut: React.FC<DiagonalCutProps> = ({
  fill = colors.neutral[50],
  direction = 'right',
  style,
  height = 64,
}) => {
  const path =
    direction === 'right'
      ? `M0,${height} L390,0 L390,${height} Z`
      : `M0,0 L390,${height} L0,${height} Z`;

  return (
    <View style={[{ width: '100%', height, overflow: 'hidden' }, style]}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 390 ${height}`}
        preserveAspectRatio="none"
      >
        <Path d={path} fill={fill} />
      </Svg>
    </View>
  );
};

// Legacy default export kept for backward compat
export default SectionDivider;
