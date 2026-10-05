// ============================================================================
// MOTION SPLASH — Nordi Remitwave
// Plays after the Expo static splash.
//
//   1. Wind carries the logo in from the left; it decelerates and stops dead
//      centre while a wave-shaped stream of dust blows past.
//   2. The wordmark settles. The logo holds (it breathes) until `ready`.
//   3. The logo dissolves into dust and smoke that blow off to the right
//      along the same wave, then the whole screen fades into home / login.
//
// Dust is drawn in Skia (one draw call per depth layer, driven entirely on the
// UI thread). The logo, wordmark and fade run on Reanimated. Depth comes from
// device-tilt parallax.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, Image } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { BlurMask, Canvas, Group, Points, type SkPoint } from '@shopify/react-native-skia';

import { colors } from '@nordi/shared/constants/colors';
import Images  from '@/constants/ImageStrings';
import { useTilt, type Tilt } from '@/core/hooks/use-tilt';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Keep identical to the static splash backgroundColor in app.json. */
const BG = colors.primary.DEFAULT; // #1E3A8A

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
// Dust layers — seeded once so every launch looks identical
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

interface Layer {
  count: number;
  /** Point diameter in px. */
  size: number;
  /** Mask blur radius. 0 = crisp. */
  blur: number;
  opacity: number;
  color: string;
  /** Fraction of the intro this layer trails the previous one by. */
  lag: number;
  /** Parallax travel in px. */
  depth: number;
  a: number[];
  b: number[];
  c: number[];
  d: number[];
}

function makeLayer(cfg: Omit<Layer, 'a' | 'b' | 'c' | 'd'>, seed: number): Layer {
  const rnd = mulberry32(seed);
  const fill = () => Array.from({ length: cfg.count }, () => rnd());
  return { ...cfg, a: fill(), b: fill(), c: fill(), d: fill() };
}

const LAYERS: Layer[] = [
  // fine specks
  makeLayer(
    { count: 56, size: 2.2, blur: 0, opacity: 0.95, color: colors.white, lag: 0, depth: 10 },
    11,
  ),
  // dust
  makeLayer(
    { count: 26, size: 7, blur: 2.5, opacity: 0.55, color: colors.primary[200], lag: 0.08, depth: 18 },
    23,
  ),
  // smoke
  makeLayer(
    { count: 12, size: 34, blur: 16, opacity: 0.22, color: colors.primary[300], lag: 0.16, depth: 30 },
    37,
  ),
];

interface DustLayerProps {
  layer: Layer;
  W: number;
  H: number;
  enter: SharedValue<number>;
  exit: SharedValue<number>;
  clock: SharedValue<number>;
  tilt: Tilt;
}

function DustLayer({ layer, W, H, enter, exit, clock, tilt }: DustLayerProps) {
  const points = useDerivedValue<SkPoint[]>(() => {
    const out: SkPoint[] = [];
    const e = enter.value;
    const x = exit.value;
    const phase = clock.value * TAU;
    const cx = W / 2;
    const cy = H / 2;

    for (let i = 0; i < layer.count; i++) {
      const a = layer.a[i];
      const b = layer.b[i];
      const c = layer.c[i];
      const d = layer.d[i];
      let px: number;
      let py: number;

      if (x > 0) {
        // Outro: born inside the logo, blown right along the wave, drifting up/down.
        const p = smooth(x);
        px = cx + (a - 0.5) * LOGO_SIZE * 1.2 + p * W * (0.55 + c * 0.9);
        const wave = Math.sin((px / W) * TAU * 1.3 + phase + d * 6) * (10 + 22 * c) * p;
        const lift = (d - 0.35) * 90 * p;
        py = cy + (b - 0.5) * LOGO_SIZE * 1.2 + wave - lift;
      } else {
        // Intro: a wave-shaped band of dust streams in from the left and slows to a stop.
        const p = easeOutCubic(clamp01(e * (0.82 + c * 0.36)));
        px = -W * (0.1 + a * 0.9) + W * (0.95 + c * 0.95) * p;
        const wave = Math.sin((px / W) * TAU * 1.3 + phase + d * 6) * (12 + 26 * c);
        py = cy + (b - 0.5) * H * 0.3 + wave;
      }

      out.push({ x: px, y: py });
    }
    return out;
  });

  const opacity = useDerivedValue(() => {
    const t = clamp01((enter.value - layer.lag) / (1 - layer.lag));
    const intro = Math.sin(Math.PI * t);
    const ex = exit.value;
    const outro = Math.sin(Math.PI * Math.pow(clamp01(ex), 0.7));
    return layer.opacity * (ex > 0 ? outro : intro);
  });

  const transform = useDerivedValue(() => [
    { translateX: tilt.x.value * layer.depth },
    { translateY: tilt.y.value * layer.depth },
  ]);

  return (
    <Group opacity={opacity} transform={transform}>
      <Points
        points={points}
        mode="points"
        color={layer.color}
        style="stroke"
        strokeWidth={layer.size}
        strokeCap="round"
      >
        {layer.blur > 0 ? <BlurMask blur={layer.blur} style="normal" /> : null}
      </Points>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

interface MotionSplashScreenProps {
  /**
   * The app has finished bootstrapping (fonts, storage, auth check).
   * The outro starts once the intro has played AND this is true. Default true,
   * which simply plays the whole sequence through.
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

  // Intro
  useEffect(() => {
    clock.value = withRepeat(
      withTiming(1, { duration: 5200, easing: Easing.linear }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Outro
  const canExit = introDone && ready && !error;
  useEffect(() => {
    if (!canExit) return;
    const exitMs = reduceMotion ? 300 : T.exit;
    exit.value = withDelay(T.hold, withTiming(1, { duration: exitMs, easing: Easing.linear }));
    fade.value = withDelay(
      T.hold + exitMs * 0.6,
      withTiming(0, { duration: T.fade, easing: Easing.out(Easing.quad) }, (done) => {
        if (done) runOnJS(emitFinish)();
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canExit]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const logoStyle = useAnimatedStyle(() => {
    const m = reduceMotion ? 0 : 1;
    const p = easeOutCubic(enter.value);
    const x = exit.value;

    const inX = interpolate(p, [0, 1], [-W * 0.62, 0]);
    const outX = x * x * W * 0.42;
    const stretch =
      interpolate(p, [0, 0.8, 1], [1.55, 1.05, 1], Extrapolation.CLAMP) + x * 0.45;

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
        { translateY: interpolate(e, [0.72, 1], [8, 0], Extrapolation.CLAMP) * m },
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
    <Animated.View style={[styles.root, rootStyle]} onLayout={handleLayout}>
      {/* Logo — centred exactly */}
      <Animated.View
        style={[
          styles.logo,
          { left: W / 2 - LOGO_SIZE / 2, top: H / 2 - LOGO_SIZE / 2 },
          logoStyle,
        ]}
      >
       <Image source={Images.Logo} style={{ width: LOGO_SIZE, height: LOGO_SIZE }} />
      </Animated.View>

      {/* Dust + smoke, drawn over the logo so it reads as dissolving */}
      {!reduceMotion && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Canvas style={StyleSheet.absoluteFill}>
            {LAYERS.map((layer, i) => (
              <DustLayer
                key={i}
                layer={layer}
                W={W}
                H={H}
                enter={enter}
                exit={exit}
                clock={clock}
                tilt={tilt}
              />
            ))}
          </Canvas>
        </View>
      )}

      {/* Wordmark + error state */}
      <View
        pointerEvents="box-none"
        style={[styles.textWrap, { top: H / 2 + LOGO_SIZE / 2 + WORDMARK_GAP }]}
      >
        <Animated.View style={[styles.wordmark, wordStyle]}>
          <Text style={styles.name}>{BRAND.name}</Text>
          <Text style={styles.tag}>{BRAND.tag}</Text>
        </Animated.View>

        {error ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.errorBlock}>
            <Text style={styles.errorText}>{error}</Text>
            {onRetry ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Try again"
                onPress={onRetry}
                style={({ pressed }) => [styles.retry, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.retryText}>Try again</Text>
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
    backgroundColor: BG,
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
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 5,
    paddingLeft: 5, // optically re-centre the tracked text
  },
  tag: {
    color: colors.primary[200],
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 4,
    marginTop: 6,
    paddingLeft: 4,
    opacity: 0.8,
  },
  errorBlock: {
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 40,
  },
  errorText: {
    color: colors.primary[100],
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
    borderColor: colors.primary[300],
  },
  retryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});