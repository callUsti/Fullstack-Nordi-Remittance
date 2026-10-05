// ============================================================================
// ONBOARDING — Nordi Remitwave
// Flat brand blue, hairline geometry, glass chips. Each slide is a small
// 3D "stage": concentric orbits at different depths, a solid tile and floating
// glass labels. The stage tilts with the device (real perspective rotation) and
// every layer slides at its own speed as you swipe.
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Globe, Shield, TrendingUp, Wallet, type LucideIcon } from 'lucide-react-native';

import { storageService } from '@/core/services/storage-service';
import { Button } from '@/components/ui';
import { colors } from '@/constants/colors';
import { LogoMark } from '@/components/brand/logo-mark';
import { useTilt, type Tilt } from '@/hooks/use-tilt';

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

interface Slide {
  id: string;
  title: string;
  body: string;
  Icon: LucideIcon;
  chips: [string, string];
}

const SLIDES: Slide[] = [
  {
    id: 'send',
    title: 'Send money across borders',
    body: 'Transfers settle in seconds, with live exchange rates and no hidden fees.',
    Icon: Globe,
    chips: ['USD → NGN', 'Live rate'],
  },
  {
    id: 'hold',
    title: 'One account, every currency',
    body: 'Hold, convert and pay in over 30 currencies, each with its own virtual IBAN.',
    Icon: Wallet,
    chips: ['30+ currencies', 'Virtual IBAN'],
  },
  {
    id: 'grow',
    title: 'Make your balance work',
    body: 'Automated savings and competitive interest, right inside your account.',
    Icon: TrendingUp,
    chips: ['Auto-save', 'Earns interest'],
  },
  {
    id: 'secure',
    title: 'Protected by design',
    body: 'Biometric sign-in, multi-factor authentication and 24/7 fraud monitoring.',
    Icon: Shield,
    chips: ['256-bit encryption', 'Biometric login'],
  },
];

/** Chip anchors as fractions of the stage, plus parallax depth. */
const CHIP_SLOTS = [
  { x: -0.3, y: -0.36, depth: 0.55 },
  { x: 0.3, y: 0.38, depth: 0.7 },
] as const;

const STAGE_MAX = 300;

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

function usePalette() {
  const dark = useColorScheme() === 'dark';
  return {
    dark,
    ring: dark ? colors.primary[800] : colors.primary[200],
    node: dark ? colors.primary[400] : colors.primary[600],
    tile: dark ? colors.primary[500] : colors.primary[600],
    glass: dark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.62)',
    glassEdge: dark ? colors.neutral[700] : colors.neutral[200],
    chipText: dark ? colors.neutral[100] : colors.neutral[800],
    tint: dark ? ('dark' as const) : ('light' as const),
  };
}
type Palette = ReturnType<typeof usePalette>;

interface Motion {
  tilt: Tilt;
  /** 0→1 loop, drives orbit rotation. */
  spin: SharedValue<number>;
  reduce: boolean;
}

// ---------------------------------------------------------------------------
// Stage building blocks
// ---------------------------------------------------------------------------

/**
 * One parallax depth plane. `depth` > 0 sits nearer the viewer (moves more),
 * < 0 sits further away. Responds to both swiping and device tilt.
 */
function Layer({
  depth,
  offset,
  width,
  motion,
  center = true,
  children,
}: {
  depth: number;
  offset: SharedValue<number>;
  width: number;
  motion: Motion;
  center?: boolean;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const m = motion.reduce ? 0 : 1;
    return {
      transform: [
        { translateX: -offset.value * width * 0.3 * depth + motion.tilt.x.value * 14 * depth * m },
        { translateY: motion.tilt.y.value * 14 * depth * m },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, center && styles.center, style]}
    >
      {children}
    </Animated.View>
  );
}

function Orbit({
  diameter,
  turns,
  dot,
  spin,
  palette,
}: {
  diameter: number;
  /** Whole number of revolutions per spin loop; negative reverses. */
  turns: number;
  dot: number;
  spin: SharedValue<number>;
  palette: Palette;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360 * turns}deg` }],
  }));

  return (
    <Animated.View style={[{ width: diameter, height: diameter }, style]}>
      <View
        style={{
          flex: 1,
          borderRadius: diameter / 2,
          borderWidth: 1,
          borderColor: palette.ring,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: -dot / 2,
          left: diameter / 2 - dot / 2,
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: palette.node,
        }}
      />
    </Animated.View>
  );
}

function GlassChip({ label, palette }: { label: string; palette: Palette }) {
  return (
    <View
      style={{
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.glassEdge,
      }}
    >
      <BlurView intensity={40} tint={palette.tint} style={StyleSheet.absoluteFill} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 11,
          paddingVertical: 6,
          backgroundColor: palette.glass,
        }}
      >
        <View
          style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: palette.node }}
        />
        <Text style={{ fontSize: 11, fontWeight: '500', color: palette.chipText }}>{label}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide
// ---------------------------------------------------------------------------

function SlideView({
  slide,
  index,
  width,
  scrollX,
  motion,
  palette,
}: {
  slide: Slide;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
  motion: Motion;
  palette: Palette;
}) {
  const size = Math.min(width * 0.78, STAGE_MAX);
  const Icon = slide.Icon;

  // -1 (off to the left) … 0 (centred) … 1 (off to the right)
  const offset = useDerivedValue(() => scrollX.value / width - index);

  const stageStyle = useAnimatedStyle(() => {
    const m = motion.reduce ? 0 : 1;
    const o = offset.value;
    return {
      opacity: interpolate(o, [-1, 0, 1], [0, 1, 0], Extrapolation.CLAMP),
      transform: [
        { perspective: 900 },
        { scale: interpolate(o, [-1, 0, 1], [0.86, 1, 0.86], Extrapolation.CLAMP) },
        { rotateX: `${motion.tilt.y.value * -7 * m}deg` },
        { rotateY: `${motion.tilt.x.value * 7 * m}deg` },
      ],
    };
  });

  const copyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.value, [-0.6, 0, 0.6], [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: offset.value * -width * 0.08 }],
  }));

  const layerProps = { offset, width, motion };

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[{ width: size, height: size }, stageStyle]}>
        <Layer depth={-0.3} {...layerProps}>
          <Orbit diameter={size} turns={1} dot={6} spin={motion.spin} palette={palette} />
        </Layer>
        <Layer depth={-0.15} {...layerProps}>
          <Orbit diameter={size * 0.7} turns={-2} dot={5} spin={motion.spin} palette={palette} />
        </Layer>
        <Layer depth={0} {...layerProps}>
          <Orbit diameter={size * 0.42} turns={3} dot={4} spin={motion.spin} palette={palette} />
        </Layer>

        <Layer depth={0.35} {...layerProps}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              borderCurve: 'continuous',
              backgroundColor: palette.tile,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={26} color={colors.white} strokeWidth={1.6} />
          </View>
        </Layer>

        {slide.chips.map((label, i) => {
          const slot = CHIP_SLOTS[i];
          return (
            <Layer key={label} depth={slot.depth} center={false} {...layerProps}>
              <View
                style={{
                  position: 'absolute',
                  width: 180,
                  left: size / 2 + slot.x * size - 90,
                  top: size / 2 + slot.y * size - 14,
                  alignItems: 'center',
                }}
              >
                <GlassChip label={label} palette={palette} />
              </View>
            </Layer>
          );
        })}
      </Animated.View>

      <Animated.View style={[styles.copy, copyStyle]}>
        <Text
          className="text-neutral-900 dark:text-white"
          style={{ fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.4, textAlign: 'center' }}
        >
          {slide.title}
        </Text>
        <Text
          className="text-neutral-500 dark:text-neutral-400"
          style={{ fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 290 }}
        >
          {slide.body}
        </Text>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function Dot({
  i,
  width,
  scrollX,
  color,
}: {
  i: number;
  width: number;
  scrollX: SharedValue<number>;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const p = scrollX.value / width;
    return {
      width: interpolate(p, [i - 1, i, i + 1], [6, 20, 6], Extrapolation.CLAMP),
      opacity: interpolate(p, [i - 1, i, i + 1], [0.3, 1, 0.3], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: color }, style]} />;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const palette = usePalette();
  const reduce = useReducedMotion();

  const scrollRef = useRef<Animated.ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const tilt = useTilt();
  const scrollX = useSharedValue(0);
  const spin = useSharedValue(0);

  // One shared clock drives every orbit on every slide.
  useEffect(() => {
    if (reduce) return;
    spin.value = withRepeat(withTiming(1, { duration: 40000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(spin);
  }, [reduce, spin]);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const onIndexChange = useCallback((i: number) => {
    setIndex(i);
    Haptics.selectionAsync();
  }, []);

  useAnimatedReaction(
    () => Math.round(scrollX.value / width),
    (cur, prev) => {
      if (prev !== null && cur !== prev && cur >= 0 && cur < SLIDES.length) {
        runOnJS(onIndexChange)(cur);
      }
    },
  );

  const finish = useCallback(async () => {
    await storageService.setSeenOnboarding(true);
    router.replace('/(auth)/login');
  }, [router]);

  const next = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isLast) {
      scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
    } else {
      finish();
    }
  }, [finish, index, isLast, width]);

  const motion: Motion = { tilt, spin, reduce };

  return (
    <View
      className="flex-1 bg-white dark:bg-neutral-950"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar barStyle={palette.dark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-3">
        <View className="flex-row items-center gap-2">
          <LogoMark size={24} tone="onLight" />
          <Text
            className="text-neutral-900 dark:text-white"
            style={{ fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}
          >
            Nordi
          </Text>
        </View>

        {!isLast && (
          <TouchableOpacity
            onPress={finish}
            hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text className="text-neutral-500 dark:text-neutral-400" style={{ fontSize: 13 }}>
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <SlideView
            key={slide.id}
            slide={slide}
            index={i}
            width={width}
            scrollX={scrollX}
            motion={motion}
            palette={palette}
          />
        ))}
      </Animated.ScrollView>

      {/* Footer */}
      <View className="px-6 pb-4 pt-2">
        <View
          className="flex-row items-center justify-center gap-1.5 mb-5"
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${index + 1} of ${SLIDES.length}`}
        >
          {SLIDES.map((s, i) => (
            <Dot key={s.id} i={i} width={width} scrollX={scrollX} color={palette.node} />
          ))}
        </View>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={next}
          rightIcon={<ArrowRight size={16} color={colors.white} />}
        >
          {isLast ? 'Get started' : 'Continue'}
        </Button>

        <View className="mt-4 flex-row items-center justify-center gap-1.5">
          <Text className="text-neutral-500 dark:text-neutral-400" style={{ fontSize: 12 }}>
            Need an account?
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://nordi-remittance.web.app/auth/signup')}
            accessibilityRole="link"
            accessibilityLabel="Open an account on the web"
          >
            <Text
              className="text-primary-600 dark:text-primary-400"
              style={{ fontSize: 12, fontWeight: '600' }}
            >
              Open one on the web
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    marginTop: 36,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
});