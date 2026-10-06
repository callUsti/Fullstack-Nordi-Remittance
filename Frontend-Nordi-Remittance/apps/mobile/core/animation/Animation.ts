// ============================================================================
// ANIMATION PRESETS — React Native Reanimated / Animated API
// ============================================================================
// All Framer-Motion-style variant objects have been replaced with
// react-native-reanimated withTiming / withSpring helpers so the same
// conceptual API works on iOS and Android.
// ============================================================================

import {
  WithTimingConfig,
  WithSpringConfig,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

// ========================
// TIMING CONSTANTS
// ========================
export const DURATIONS = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  slower: 800,
  slowest: 1200,
} as const;

// ========================
// EASING PRESETS
// ========================
export const EASINGS = {
  linear: Easing.linear,
  ease: Easing.inOut(Easing.ease),
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  smooth: Easing.bezier(0.4, 0, 0.2, 1),
  smoothIn: Easing.bezier(0.4, 0, 1, 1),
  smoothOut: Easing.bezier(0, 0, 0.2, 1),
  bounce: Easing.bounce,
  elastic: Easing.elastic(1.5),
  sharp: Easing.bezier(0.4, 0, 0.6, 1),
} as const;

// ========================
// SPRING CONFIGS
// ========================
export const SPRINGS: Record<string, WithSpringConfig> = {
  gentle:   { stiffness: 120, damping: 14 },
  wobbly:   { stiffness: 180, damping: 12 },
  stiff:    { stiffness: 210, damping: 20 },
  slow:     { stiffness: 280, damping: 60 },
  molasses: { stiffness: 280, damping: 120 },
  default:  { stiffness: 400, damping: 30 },
  snappy:   { stiffness: 500, damping: 25 },
};

// ========================
// FADE HELPERS
// ========================
export const fadeIn = (duration = DURATIONS.normal) =>
  withTiming(1, { duration, easing: EASINGS.smooth });

export const fadeOut = (duration = DURATIONS.fast) =>
  withTiming(0, { duration, easing: EASINGS.smooth });

// ========================
// SLIDE HELPERS
// ========================
/** Slide an element UP into view (translateY 20 → 0) */
export const slideUp = (duration = DURATIONS.normal) =>
  withTiming(0, { duration, easing: EASINGS.smoothOut });

/** Slide an element DOWN into view (translateY -20 → 0) */
export const slideDown = (duration = DURATIONS.normal) =>
  withTiming(0, { duration, easing: EASINGS.smoothOut });

/** Slide an element in from the LEFT (translateX 20 → 0) */
export const slideLeft = (duration = DURATIONS.normal) =>
  withTiming(0, { duration, easing: EASINGS.smoothOut });

/** Slide an element in from the RIGHT (translateX -20 → 0) */
export const slideRight = (duration = DURATIONS.normal) =>
  withTiming(0, { duration, easing: EASINGS.smoothOut });

// ========================
// SCALE HELPERS
// ========================
export const scaleIn = (toScale = 1, config: WithSpringConfig = SPRINGS.default) =>
  withSpring(toScale, config);

export const scaleOut = (toScale = 0.95, duration = DURATIONS.fast) =>
  withTiming(toScale, { duration });

// ========================
// STAGGER DELAY HELPER
// ========================
/** Returns a delayed fade-in for staggered list items */
export const staggerDelay = (
  index: number,
  baseDelay = 100,
  duration = DURATIONS.normal,
) => withDelay(index * baseDelay, withTiming(1, { duration, easing: EASINGS.smoothOut }));

// ========================
// SPRING ANIMATIONS
// ========================
export const springIn = (config: WithSpringConfig = SPRINGS.default) =>
  withSpring(1, config);

export const springOut = (config: WithSpringConfig = SPRINGS.default) =>
  withSpring(0, config);

// ========================
// SHIMMER / SKELETON HELPER
// (drive with a shared value looped -1 → 1)
// ========================
export const shimmerLoop = (duration = 1500) =>
  withRepeat(
    withSequence(
      withTiming(1, { duration, easing: Easing.linear }),
      withTiming(-1, { duration: 0 }), // instant reset
    ),
    -1,
    false,
  );

// ========================
// PULSE ANIMATION (opacity 0.6 ↔ 1)
// ========================
export const pulseLoop = (duration = 1500) =>
  withRepeat(
    withSequence(
      withTiming(1, { duration: duration / 2 }),
      withTiming(0.6, { duration: duration / 2 }),
    ),
    -1,
    true,
  );

// ========================
// ROTATE 360 (spinner)
// ========================
export const spin360 = (duration = 1000) =>
  withRepeat(withTiming(360, { duration, easing: Easing.linear }), -1, false);

// ========================
// BOUNCE DOT (scale pulse)
// ========================
export const bounceDot = (index: number, duration = 800) =>
  withDelay(
    index * 150,
    withRepeat(
      withSequence(
        withTiming(1.3, { duration: duration / 2 }),
        withTiming(1, { duration: duration / 2 }),
      ),
      -1,
      true,
    ),
  );

// ========================
// TOAST SLIDE-IN (from top)
// ========================
export const toastEnter = withSpring(0, SPRINGS.snappy);
export const toastExit = (duration = DURATIONS.fast) =>
  withTiming(-100, { duration });

// ========================
// PAGE TRANSITION HELPERS
// ========================
export const pageTransitions = {
  fade: {
    enter: () => withTiming(1, { duration: DURATIONS.normal }),
    exit:  () => withTiming(0, { duration: DURATIONS.fast }),
  },
  slideRight: {
    enterX: () => withTiming(0, { duration: DURATIONS.normal, easing: EASINGS.smooth }),
    exitX:  () => withTiming(100, { duration: DURATIONS.fast }),
    initial: -100,
  },
  slideLeft: {
    enterX: () => withTiming(0, { duration: DURATIONS.normal, easing: EASINGS.smooth }),
    exitX:  () => withTiming(-100, { duration: DURATIONS.fast }),
    initial: 100,
  },
  scale: {
    enter: () => withSpring(1, SPRINGS.default),
    exit:  () => withTiming(0.9, { duration: DURATIONS.fast }),
    initialScale: 0.9,
  },
} as const;

// ========================
// CARD ANIMATIONS
// ========================
export const cardPressIn  = () => withTiming(0.97, { duration: DURATIONS.fast });
export const cardPressOut = () => withSpring(1, SPRINGS.gentle);
export const cardHoverLift = () => withTiming(-4, { duration: DURATIONS.fast });

// ========================
// BUTTON ANIMATIONS
// ========================
export const buttonPressIn  = () => withTiming(0.95, { duration: DURATIONS.instant });
export const buttonPressOut = () => withSpring(1, SPRINGS.snappy);

// ========================
// DASHBOARD ITEM (snappy entry with stagger)
// ========================
export const dashboardItemEnter = (index: number) =>
  withDelay(
    index * 60,
    withTiming(1, { duration: 350, easing: EASINGS.smoothOut }),
  );

export const dashboardItemTranslateY = (index: number) =>
  withDelay(
    index * 60,
    withTiming(0, { duration: 350, easing: EASINGS.smoothOut }),
  );

export const sidebarItemEnter = (index: number) =>
  withDelay(
    index * 50,
    withTiming(1, { duration: 250, easing: EASINGS.smoothOut }),
  );

// ========================
// FRAMER-MOTION COMPATIBILITY VARIANTS
// ========================
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

export const dashboardContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export const dashboardItemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const toastVariants = {
  initial: { opacity: 0, y: -30, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
  transition: { duration: 0.25 },
};

export default {
  DURATIONS,
  EASINGS,
  SPRINGS,
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scaleIn,
  scaleOut,
  staggerDelay,
  springIn,
  springOut,
  shimmerLoop,
  pulseLoop,
  spin360,
  bounceDot,
  toastEnter,
  toastExit,
  pageTransitions,
  cardPressIn,
  cardPressOut,
  buttonPressIn,
  buttonPressOut,
  dashboardItemEnter,
  dashboardItemTranslateY,
  sidebarItemEnter,
};