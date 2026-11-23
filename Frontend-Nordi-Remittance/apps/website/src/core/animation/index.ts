// ============================================================================
// ANIMATION INDEX - Central export for all animation utilities
// ============================================================================

// Re-export all from the original Animation.ts for backward compatibility
export * from './Animation';

// Export enhanced presets (excluding ambiguous duplicates already in Animation.ts)
export {
  DURATIONS,
  EASINGS,
  SPRINGS,
  fadeVariants,
  fadeScaleVariants,
  slideLeftVariants,
  slideRightVariants,
  staggerContainerVariants,
  staggerItemVariants,
  pageTransitions,
  modalOverlayVariants,
  modalSlideUpVariants,
  dropdownVariants,
  hoverScale,
  tapScale,
  hoverLift,
  viewportOnce,
  viewportAlways,
  whileInViewSlideUp,
  whileInViewFade,
  whileInViewScale,
  getStaggeredProps,
  getStaggeredFadeProps,
  shimmerVariants,
  pulseVariants,
  cardFlipVariants,
  createStaggerVariants,
  createSlideVariants,
} from './presets';
