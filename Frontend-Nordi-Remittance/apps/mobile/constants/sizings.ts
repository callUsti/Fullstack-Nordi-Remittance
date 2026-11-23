// ============================================================================
// SIZINGS & BREAKPOINTS CONSTANTS — Nordi Remittance Mobile
// Minimalist, compact, high-density luxury tokens
// ============================================================================

export const BREAKPOINTS = {
  small: 360,
  medium: 480,
  tablet: 600,
  foldable: 680,
  large: 768,
} as const;

export const SPACING = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const FONT_SIZES = {
  nano: 9,
  micro: 10,
  caption: 11,
  bodySm: 12,
  body: 13,
  subhead: 14,
  titleSm: 15,
  title: 16,
  headline: 18,
  hero: 22,
  display: 28,
} as const;

export const ICON_SIZES = {
  nano: 12,
  micro: 14,
  xs: 14,
  sm: 16,
  md: 18,
  base: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
} as const;

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const LAYOUT = {
  maxContentWidth: 680,
  tabBarHeightIos: 88,
  tabBarHeightAndroid: 72,
  headerHeight: 52,
  cardBorderRadius: 14,
  compactCardPadding: 12,
  standardCardPadding: 16,
} as const;

export default {
  BREAKPOINTS,
  SPACING,
  FONT_SIZES,
  ICON_SIZES,
  RADIUS,
  LAYOUT,
};
