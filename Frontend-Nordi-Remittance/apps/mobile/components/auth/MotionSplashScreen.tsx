// ============================================================================
// Shared motion splash — Nordi Remitwave
// Plays after the Expo static splash.
//
//   1. Radio frequency waves (audio frequency candlesticks / voice-note bars)
//      stream in from the left along intertwining DNA-like double-helix strands.
//   2. The logo decelerates into dead center while the frequency strands pulse
//      and breathe around it.
//   3. On outro, the frequency bars dissolve and surge off to the right along
//      the wave, then the entire splash fades smoothly into the app.
//
// High-performance Reanimated worklets with dynamic Light/Dark theme support.
// Dark Mode: Deep rich slate background (#020617) with luminous sharp blue & white waves.
// Light Mode: Clean crisp white background (#FFFFFF) with sharp primary blue waves.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Image,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { colors } from '@nordi/shared/constants/colors';
import Images from '@/constants/ImageStrings';
import { useTilt, type Tilt } from '@/core/hooks/use-tilt';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BRAND = { name: 'NORDI', tag: 'REMITWAVE' };
const LOGO_SIZE = 84;
const WORDMARK_GAP = 26;

/** Milliseconds. */
const T = { enter: 1500, hold: 600, exit: 1150, fade: 500 } as const;

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Worklet helpers
// ---------------------------------------------------------------------------

function clamp01(v: number) {
  'worklet';
  return Math.min(1, Math.max(0, v));
}
function easeOutCubic(v: number) {
  'worklet';
  const t = 1 - v;
  return 1 - t * t * t;
}
function smooth(v: number) {
  'worklet';
  return v * v * (3 - 2 * v);
}

// ---------------------------------------------------------------------------
// Seeded Frequency Bar generator (WhatsApp voice note / Hertz candlestick waves)
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface WaveBarConfig {
  a: number; // horizontal placement seed
  b: number; // vertical baseline jitter
  c: number; // frequency wave velocity
  d: number; // individual pulse phase seed
  strand: 'alpha' | 'beta'; // DNA double-helix strand
  width: number;
  baseHeight: number;
  color: string;
  opacity: number;
  lag: number;
  depth: number;
}

// Candlestick height distribution (mimics voice recorder peaks & troughs)
const CANDLE_HEIGHTS = [
  10, 16, 26, 42, 34, 18, 12, 22, 38, 46, 28, 14, 20, 36, 44, 24, 12, 18, 30,
  44, 26, 14,
];

function generateFrequencyBars(isDark: boolean): WaveBarConfig[] {
  const bars: WaveBarConfig[] = [];
  const rnd = mulberry32(19);

  // Strand Alpha (Upper DNA helix strand)
  for (let i = 0; i < 22; i++) {
    const height = CANDLE_HEIGHTS[i % CANDLE_HEIGHTS.length];
    bars.push({
      a: i / 22,
      b: rnd() * 0.4 - 0.2,
      c: rnd(),
      d: rnd(),
      strand: 'alpha',
      width: 3,
      baseHeight: height,
      color: isDark
        ? (i % 2 === 0 ? colors.white : '#93C5FD')
        : (i % 2 === 0 ? colors.primary[700] : colors.primary[600]), // Rich royal/primary blue in light mode
      opacity: isDark ? 0.95 : 0.9,
      lag: (i / 22) * 0.12,
      depth: 14,
    });
  }

  // Strand Beta (Lower DNA helix strand — intertwining counter-phase)
  for (let i = 0; i < 22; i++) {
    const height = CANDLE_HEIGHTS[(i + 5) % CANDLE_HEIGHTS.length];
    bars.push({
      a: (i + 0.5) / 22,
      b: rnd() * 0.4 - 0.2,
      c: rnd(),
      d: rnd(),
      strand: 'beta',
      width: 2.8,
      baseHeight: height * 0.85,
      color: isDark
        ? (i % 2 === 0 ? '#60A5FA' : '#38BDF8')
        : (i % 2 === 0 ? colors.primary[500] : colors.primary[800]), // Sharp brand blue in light mode
      opacity: isDark ? 0.82 : 0.75,
      lag: 0.04 + (i / 22) * 0.12,
      depth: 22,
    });
  }

  // Accent Harmonic Bars (deep ambient pulse)
  for (let i = 0; i < 10; i++) {
    const height = CANDLE_HEIGHTS[(i * 2) % CANDLE_HEIGHTS.length];
    bars.push({
      a: (i * 2.2) / 22,
      b: rnd() * 0.6 - 0.3,
      c: rnd(),
      d: rnd(),
      strand: i % 2 === 0 ? 'alpha' : 'beta',
      width: 2.2,
      baseHeight: height * 0.6,
      color: isDark ? '#BFDBFE' : colors.primary[400],
      opacity: isDark ? 0.5 : 0.45,
      lag: 0.08,
      depth: 28,
    });
  }

  return bars;
}

// ---------------------------------------------------------------------------
// Animated Frequency Bar (Candlestick / Radio Wave)
// ---------------------------------------------------------------------------

interface FrequencyBarProps {
  config: WaveBarConfig;
  W: number;
  H: number;
  enter: SharedValue<number>;
  exit: SharedValue<number>;
  clock: SharedValue<number>;
  tilt: Tilt;
}

const FrequencyBar: React.FC<FrequencyBarProps> = ({
  config,
  W,
  H,
  enter,
  exit,
  clock,
  tilt,
}) => {
  const {
    a,
    b,
    c,
    d,
    strand,
    width,
    baseHeight,
    color,
    opacity: baseOpacity,
    lag,
    depth,
  } = config;

  const animStyle = useAnimatedStyle(() => {
    const e = enter.value;
    const x = exit.value;
    const phase = clock.value * TAU;
    const cx = W / 2;
    const cy = H / 2;

    // Counter-phase DNA strand offset: alpha = 0, beta = π (intertwining twist)
    const strandPhase = strand === 'alpha' ? 0 : Math.PI;

    let px: number;
    let py: number;

    if (x > 0) {
      // Outro: born inside the logo, surge off to the right along frequency wave
      const p = smooth(x);
      px = cx + (a - 0.5) * LOGO_SIZE * 1.2 + p * W * (0.6 + c * 0.85);
      const wave =
        Math.sin((px / W) * TAU * 1.5 + phase + strandPhase + d * 4) *
        (12 + 22 * c) *
        p;
      const lift = (d - 0.4) * 80 * p;
      py = cy + (b - 0.5) * LOGO_SIZE * 1.2 + wave - lift;
    } else {
      // Intro: frequency waves stream in from the left and settle around the center
      const p = easeOutCubic(clamp01(e * (0.85 + c * 0.32)));
      px = -W * (0.15 + a * 0.85) + W * (0.95 + c * 0.95) * p;
      const wave =
        Math.sin((px / W) * TAU * 1.5 + phase + strandPhase) * (14 + 24 * c);
      py = cy + b * H * 0.25 + wave;
    }

    // Audio frequency candlestick pulsation (live voice-recorder vibration)
    const hertzPulse =
      0.55 + 0.45 * Math.abs(Math.sin(phase * 1.8 + d * 5 + strandPhase));

    // Opacity fades
    const t = clamp01((e - lag) / (1 - lag));
    const introOp = Math.sin(Math.PI * t);
    const outroOp = Math.sin(Math.PI * Math.pow(clamp01(x), 0.7));
    const currentOpacity = baseOpacity * (x > 0 ? outroOp : introOp);

    return {
      transform: [
        { translateX: px + tilt.x.value * depth },
        { translateY: py + tilt.y.value * depth },
        { scaleY: hertzPulse },
      ],
      opacity: currentOpacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width,
          height: baseHeight,
          borderRadius: 999, // Smooth rounded voice note candlestick
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
};

// ---------------------------------------------------------------------------
// Motion Splash Screen
// ---------------------------------------------------------------------------

interface MotionSplashScreenProps {
  /**
   * The app has finished bootstrapping (fonts, storage, auth check).
   * The outro starts once the intro has played AND this is true. Default true.
   */
  ready?: boolean;
  /** Fires once on first layout. Call SplashScreen.hideAsync() here. */
  onShown?: () => void;
  /** Fires after the fade-out completes. Unmount the splash here. */
  onFinish?: () => void;
  /** Shows the message and retry action. Holds the splash until cleared. */
  error?: string | null;
  onRetry?: () => void;
}

export default function MotionSplashScreen({
  ready = true,
  onShown,
  onFinish,
  error,
  onRetry,
}: MotionSplashScreenProps) {
  const { width: W, height: H } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const tilt = useTilt();
  const theme = useMobileTheme();
  const isDark = theme.isDark;

  // Background matching custom theme mode (rich dark contrast vs crisp white)
  const bg = isDark ? '#020617' : '#FFFFFF';

  const frequencyBars = useMemo(() => generateFrequencyBars(isDark), [isDark]);

  const enter = useSharedValue(0);
  const exit = useSharedValue(0);
  const fade = useSharedValue(1);
  const clock = useSharedValue(0);
  const breathe = useSharedValue(0);

  const [introDone, setIntroDone] = useState(false);
  const [gone, setGone] = useState(false);

  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const shownRef = useRef(false);

  const emitFinish = useCallback(() => {
    setGone(true);
    finishRef.current?.();
  }, []);

  // Intro Sequence
  useEffect(() => {
    clock.value = withRepeat(
      withTiming(1, { duration: 4800, easing: Easing.linear }),
      -1,
      false,
    );
    breathe.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    enter.value = withTiming(
      1,
      { duration: reduceMotion ? 350 : T.enter, easing: Easing.linear },
      (done) => {
        if (done) runOnJS(setIntroDone)(true);
      },
    );
    return () => {
      cancelAnimation(clock);
      cancelAnimation(breathe);
      cancelAnimation(enter);
    };
  }, [breathe, clock, enter, reduceMotion]);

  // Outro Sequence
  const canExit = introDone && ready && !error;
  useEffect(() => {
    if (!canExit) return;
    const exitMs = reduceMotion ? 300 : T.exit;
    exit.value = withDelay(
      T.hold,
      withTiming(1, { duration: exitMs, easing: Easing.linear }),
    );
    fade.value = withDelay(
      T.hold + exitMs * 0.6,
      withTiming(
        0,
        { duration: T.fade, easing: Easing.out(Easing.quad) },
        (done) => {
          if (done) runOnJS(emitFinish)();
        },
      ),
    );
  }, [canExit, emitFinish, exit, fade, reduceMotion]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const logoStyle = useAnimatedStyle(() => {
    const m = reduceMotion ? 0 : 1;
    const p = easeOutCubic(enter.value);
    const x = exit.value;

    const inX = interpolate(p, [0, 1], [-W * 0.62, 0]);
    const outX = x * x * W * 0.42;
    const stretch =
      interpolate(p, [0, 0.8, 1], [1.55, 1.05, 1], Extrapolation.CLAMP) +
      x * 0.45;

    return {
      opacity:
        interpolate(p, [0, 0.25], [0, 1], Extrapolation.CLAMP) *
        (1 - interpolate(x, [0.05, 0.65], [0, 1], Extrapolation.CLAMP)),
      transform: [
        { translateX: (inX + outX) * m + tilt.x.value * 7 * m },
        { translateY: tilt.y.value * 7 * m },
        { scaleX: 1 + (stretch - 1) * m },
        { scale: 1 + breathe.value * 0.025 * (1 - x) * m },
      ],
    };
  });

  const wordStyle = useAnimatedStyle(() => {
    const m = reduceMotion ? 0 : 1;
    const e = enter.value;
    const x = exit.value;
    return {
      opacity:
        interpolate(e, [0.72, 1], [0, 1], Extrapolation.CLAMP) *
        (1 - interpolate(x, [0, 0.5], [0, 1], Extrapolation.CLAMP)),
      transform: [
        {
          translateY:
            interpolate(e, [0.72, 1], [8, 0], Extrapolation.CLAMP) * m,
        },
        { translateX: x * x * W * 0.18 * m },
      ],
    };
  });

  const handleLayout = useCallback(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    onShown?.();
  }, [onShown]);

  if (gone) return null;

  return (
    <Animated.View
      style={[styles.root, { backgroundColor: bg }, rootStyle]}
      onLayout={handleLayout}
    >
      {/* Radio frequency & DNA candlestick wave stream */}
      {!reduceMotion && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {frequencyBars.map((bar, idx) => (
            <FrequencyBar
              key={idx}
              config={bar}
              W={W}
              H={H}
              enter={enter}
              exit={exit}
              clock={clock}
              tilt={tilt}
            />
          ))}
        </View>
      )}

      {/* Logo — sharp blue logo centered */}
      <Animated.View
        style={[
          styles.logo,
          { left: W / 2 - LOGO_SIZE / 2, top: H / 2 - LOGO_SIZE / 2 },
          logoStyle,
        ]}
      >
        <Image
          source={Images.Logo}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
        />
      </Animated.View>

      {/* Wordmark + error state */}
      <View
        pointerEvents="box-none"
        style={[styles.textWrap, { top: H / 2 + LOGO_SIZE / 2 + WORDMARK_GAP }]}
      >
        <Animated.View style={[styles.wordmark, wordStyle]}>
          <Text
            style={[
              styles.name,
              { color: isDark ? colors.white : colors.neutral[900] },
            ]}
          >
            {BRAND.name}
          </Text>
          <Text
            style={[
              styles.tag,
              { color: isDark ? colors.primary[400] : colors.primary[600] },
            ]}
          >
            {BRAND.tag}
          </Text>
        </Animated.View>

        {error ? (
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.errorBlock}
          >
            <Text
              style={[
                styles.errorText,
                { color: isDark ? colors.primary[100] : colors.primary[900] },
              ]}
            >
              {error}
            </Text>
            {onRetry ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Try again"
                onPress={onRetry}
                style={({ pressed }) => [
                  styles.retry,
                  {
                    borderColor: isDark
                      ? colors.primary[400]
                      : colors.primary[600],
                  },
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text
                  style={[
                    styles.retryText,
                    { color: isDark ? colors.white : colors.primary[700] },
                  ]}
                >
                  Try again
                </Text>
              </Pressable>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
  },
  logo: {
    position: 'absolute',
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  textWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  wordmark: {
    alignItems: 'center',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 5,
    paddingLeft: 5,
  },
  tag: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 4,
    marginTop: 6,
    paddingLeft: 4,
    opacity: 0.9,
  },
  errorBlock: {
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  retry: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});