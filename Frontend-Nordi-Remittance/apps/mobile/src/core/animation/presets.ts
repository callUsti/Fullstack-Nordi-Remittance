// ============================================================================
// ANIMATION PRESETS — React Native Reanimated helpers
// ============================================================================
// Re-exports everything from Animation.ts plus extra stagger/variant utilities.
// Replaces Framer Motion's "Variants / Transition / TargetAndTransition" types
// with plain objects compatible with react-native-reanimated useAnimatedStyle.
// ============================================================================

export * from './Animation';

import {
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { DURATIONS, EASINGS, SPRINGS } from './Animation';

// ========================
// FADE VARIANTS
// ========================
export const fadeVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

export const fadeScaleVariants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.95 },
};

// ========================
// SLIDE VARIANTS
// (initial values for useSharedValue, then animate with helpers)
// ========================
export const slideUpVariants = {
  hidden:  { opacity: 0, translateY: 20 },
  visible: { opacity: 1, translateY: 0 },
  exit:    { opacity: 0, translateY: -10 },
};

export const slideDownVariants = {
  hidden:  { opacity: 0, translateY: -20 },
  visible: { opacity: 1, translateY: 0 },
  exit:    { opacity: 0, translateY: 10 },
};

export const slideLeftVariants = {
  hidden:  { opacity: 0, translateX: 20 },
  visible: { opacity: 1, translateX: 0 },
  exit:    { opacity: 0, translateX: -20 },
};

export const slideRightVariants = {
  hidden:  { opacity: 0, translateX: -20 },
  visible: { opacity: 1, translateX: 0 },
  exit:    { opacity: 0, translateX: 20 },
};

// ========================
// STAGGER HELPERS
// ========================
/**
 * Returns animated opacity value for staggered list items.
 * Use in useEffect after mounting.
 */
export const staggerContainerVariants = (staggerDelayMs = 100) => ({
  delayChildren: 100,
  staggerDelay: staggerDelayMs,
});

export const staggerItemVariants = {
  hidden:  { opacity: 0, translateY: 15 },
  visible: { opacity: 1, translateY: 0 },
  exit:    { opacity: 0, translateY: -10 },
};

/**
 * Build animated value for a staggered child at `index`.
 * Usage:
 *   const opacity = useSharedValue(0);
 *   useEffect(() => { opacity.value = staggeredFade(index); }, []);
 */
export const staggeredFade = (index: number, baseDelay = 100) =>
  withDelay(
    index * baseDelay,
    withTiming(1, { duration: DURATIONS.normal, easing: EASINGS.smoothOut }),
  );

export const staggeredSlideUp = (index: number, baseDelay = 100) =>
  withDelay(
    index * baseDelay,
    withTiming(0, { duration: DURATIONS.normal, easing: EASINGS.smoothOut }),
  );

// ========================
// PAGE TRANSITIONS
// ========================
export const pageTransitionPresets = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit:    { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, translateY: 30 },
    animate: { opacity: 1, translateY: 0 },
    exit:    { opacity: 0, translateY: -30 },
  },
  slideRight: {
    initial: { opacity: 0, translateX: -100 },
    animate: { opacity: 1, translateX: 0 },
    exit:    { opacity: 0, translateX: 100 },
  },
  slideLeft: {
    initial: { opacity: 0, translateX: 100 },
    animate: { opacity: 1, translateX: 0 },
    exit:    { opacity: 0, translateX: -100 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit:    { opacity: 0, scale: 1.1 },
  },
} as const;

// ========================
// MODAL VARIANTS
// ========================
export const modalOverlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

export const modalContentVariants = {
  hidden:  { opacity: 0, scale: 0.95, translateY: 20 },
  visible: { opacity: 1, scale: 1,    translateY: 0 },
  exit:    { opacity: 0, scale: 0.95, translateY: 10 },
};

export const modalSlideUpVariants = {
  hidden:  { opacity: 0, translateY: 400 },
  visible: { opacity: 1, translateY: 0 },
  exit:    { opacity: 0, translateY: 400 },
};

// ========================
// DROPDOWN VARIANTS
// ========================
export const dropdownVariants = {
  hidden:  { opacity: 0, scale: 0.95, translateY: -10 },
  visible: { opacity: 1, scale: 1,    translateY: 0 },
  exit:    { opacity: 0, scale: 0.95, translateY: -10 },
};

// ========================
// TOAST VARIANTS
// ========================
export const toastVariants = {
  hidden:  { opacity: 0, translateY: -50, scale: 0.9 },
  visible: { opacity: 1, translateY: 0,   scale: 1 },
  exit:    { opacity: 0, translateY: -30, scale: 0.9 },
};

// ========================
// HOVER / PRESS HELPERS
// (React Native uses press callbacks, not hover)
// ========================
export const hoverScale = (scale = 1.02) => ({
  scale,
  duration: DURATIONS.fast,
});

export const tapScale = (scale = 0.98) => ({
  scale,
  duration: DURATIONS.instant,
});

export const hoverLift = {
  translateY: -4,
  duration: DURATIONS.fast,
};

// ========================
// VIEWPORT HELPERS
// (stub — use Intersection Observer / ScrollView callbacks on RN)
// ========================
export const viewportOnce  = { once: true,  margin: -50 };
export const viewportAlways = { once: false, margin: -50 };

// ========================
// SHIMMER / SKELETON ANIMATION
// ========================
export const shimmerVariants = {
  initial: { translateX: -300 },
  animate: { translateX: 300 },
};

export const pulseVariants = {
  initial: { opacity: 0.6 },
  animate: { opacity: 1 },
};

// ========================
// CARD FLIP
// ========================
export const cardFlipVariants = {
  front: { rotateY: '0deg' },
  back:  { rotateY: '180deg' },
};

// ========================
// UTILITY FACTORIES
// ========================
export const createStaggerVariants = (delay = 100, childDuration = DURATIONS.normal) => ({
  delayChildren: 100,
  staggerDelay: delay,
  childDuration,
});

export const createSlideVariants = (
  direction: 'up' | 'down' | 'left' | 'right',
  distance = 20,
) => {
  const axes = {
    up:    { translateY: distance },
    down:  { translateY: -distance },
    left:  { translateX: distance },
    right: { translateX: -distance },
  };
  const exitAxes = {
    up:    { translateY: -(distance / 2) },
    down:  { translateY:  distance / 2 },
    left:  { translateX: -(distance / 2) },
    right: { translateX:  distance / 2 },
  };
  return {
    hidden:  { opacity: 0, ...axes[direction] },
    visible: { opacity: 1, translateX: 0, translateY: 0 },
    exit:    { opacity: 0, ...exitAxes[direction] },
  };
};

// ========================
// STAGGERED PROP FACTORIES
// (mirror of web getStaggeredProps but returns plain objects)
// ========================
export const getStaggeredProps = (index: number, baseDelay = 100) => ({
  initialOpacity: 0,
  initialTranslateY: 20,
  delay: index * baseDelay,
  duration: DURATIONS.normal,
});

export const getStaggeredFadeProps = (index: number, baseDelay = 80) => ({
  initialOpacity: 0,
  delay: index * baseDelay,
  duration: DURATIONS.normal,
});
