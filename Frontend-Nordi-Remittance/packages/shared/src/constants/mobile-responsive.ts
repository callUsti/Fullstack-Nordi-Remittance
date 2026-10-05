import { Dimensions, Platform, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Design spec baselines (iPhone X)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

/**
 * Scale a value proportionally to screen width.
 * Consistent across iOS & Android — no arbitrary offsets.
 */
export const normalize = (size: number): number => {
  const scaled = size * widthScale;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

/**
 * Moderate scale — dampens aggressive scaling for paddings, margins, radii.
 * factor 0 = no scaling, 1 = full width-based scaling (same as normalize).
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return Math.round(
    PixelRatio.roundToNearestPixel(size + (size * widthScale - size) * factor)
  );
};

/**
 * Scale based on screen height — useful for vertical spacers
 * and elements that should adapt to taller / shorter screens.
 */
export const verticalScale = (size: number): number => {
  return Math.round(PixelRatio.roundToNearestPixel(size * heightScale));
};

/**
 * Font-specific scaler that ensures a minimum readable size
 * and gives a slight bump on Android where text renders visually smaller.
 */
export const fontScale = (size: number, minSize = 11): number => {
  let scaled = size * widthScale;
  if (Platform.OS === "android") {
    scaled *= 1.04; // compensate for Android font rendering
  }
  return Math.max(
    Math.round(PixelRatio.roundToNearestPixel(scaled)),
    minSize
  );
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };