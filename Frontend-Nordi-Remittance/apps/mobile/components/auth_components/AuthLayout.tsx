// ============================================================================
// AUTH LAYOUT — React Native rewrite
// Replaces react-router-dom, framer-motion, and HTML elements with
// React Navigation, react-native-reanimated, and RN core components.
// ============================================================================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useRouter} from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@nordi/shared/constants/colors';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ========================
// TYPES
// ========================
export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  alternateAction?: {
    text: string;
    linkText: string;
    onPress: () => void;
  };
  variant?: 'login' | 'signup' | 'verify';
}

// ========================
// GRADIENT MAP
// ========================
const GRADIENT_MAP: Record<
  NonNullable<AuthLayoutProps['variant']>,
  [string, string, string]
> = {
  login:  ['#2563EB', '#1D4ED8', '#3730A3'],
  signup: ['#4F46E5', '#7C3AED', '#1D4ED8'],
  verify: ['#059669', '#0D9488', '#0891B2'],
};

// ========================
// FEATURE ITEM
// ========================
interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  delay: number;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, delay }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.featureItem, animStyle]}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={20} color={colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
    </Animated.View>
  );
};

// ========================
// AUTH LAYOUT COMPONENT
// ========================
const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showBackButton = true,
  alternateAction,
  variant = 'login',
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useMobileTheme();
  const gradient = GRADIENT_MAP[variant];

  // Animated values
  const containerOpacity  = useSharedValue(0);
  const containerTranslateX = useSharedValue(-30);
  const titleOpacity      = useSharedValue(0);
  const titleTranslateY   = useSharedValue(20);
  const contentOpacity    = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  useEffect(() => {
    containerOpacity.value   = withTiming(1, { duration: 500 });
    containerTranslateX.value = withTiming(0, { duration: 500 });
    titleOpacity.value       = withDelay(300, withTiming(1, { duration: 400 }));
    titleTranslateY.value    = withDelay(300, withTiming(0, { duration: 400 }));
    contentOpacity.value     = withDelay(400, withTiming(1, { duration: 400 }));
    contentTranslateY.value  = withDelay(400, withTiming(0, { duration: 400 }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateX: containerTranslateX.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const features = [
    {
      icon: 'shield-checkmark-outline' as const,
      title: 'Bank-Grade Security',
      description: '256-bit encryption & multi-factor authentication',
    },
    {
      icon: 'globe-outline' as const,
      title: 'Global Access',
      description: 'Manage your finances from anywhere, anytime',
    },
    {
      icon: variant === 'login' ? ('lock-closed-outline' as const) : ('card-outline' as const),
      title: variant === 'login' ? 'Secure Login' : 'Smart Banking',
      description:
        variant === 'login'
          ? 'Your data is protected with industry-leading security'
          : 'Modern tools for all your financial needs',
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.formSide, { backgroundColor: theme.background }, containerStyle]}>
          {/* ---- Header: Logo + Back ---- */}
          <View style={styles.formHeader}>
            {/* Logo wordmark */}
            <Text style={styles.logoText}>Nordea</Text>

            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={18} color={theme.iconMuted} />
                <Text style={[styles.backText, { color: theme.textMuted }]}>Back</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ---- Title ---- */}
          <Animated.View style={[styles.titleBlock, titleStyle]}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>}
            {alternateAction && (
              <Text style={[styles.altActionText, { color: theme.textMuted }]}>
                {alternateAction.text}{' '}
                <Text
                  style={[styles.altActionLink, { color: theme.primary }]}
                  onPress={alternateAction.onPress}
                >
                  {alternateAction.linkText}
                </Text>
              </Text>
            )}
          </Animated.View>

          {/* ---- Main Content (form fields) ---- */}
          <Animated.View style={[styles.formContent, contentStyle]}>
            {children}
          </Animated.View>

          {/* ---- Footer ---- */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              © {new Date().getFullYear()} Nordea Bank PLC. (Licensed by the IMF)
            </Text>
            <View style={styles.footerLinks}>
              <Text style={[styles.footerLink, { color: theme.textMuted }]}>Privacy Policy</Text>
              <Text style={[styles.footerDot, { color: theme.textMuted }]}>•</Text>
              <Text style={[styles.footerLink, { color: theme.textMuted }]}>Terms of Service</Text>
              <Text style={[styles.footerDot, { color: theme.textMuted }]}>•</Text>
              <Text style={[styles.footerLink, { color: theme.textMuted }]}>Contact</Text>
            </View>
          </View>
        </Animated.View>

        {/* ---- Branding Panel (shown on large tablets / landscape) ---- */}
        {SCREEN_WIDTH > 768 && (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandPanel}
          >
            {/* Decorative circles */}
            <View style={[styles.circle, styles.circleTopLeft]} />
            <View style={[styles.circle, styles.circleBottomRight]} />

            <View style={styles.brandContent}>
              <Text style={styles.brandTitle}>
                {variant === 'login'
                  ? 'Welcome Back!'
                  : variant === 'signup'
                    ? 'Join Nordea Banking'
                    : 'Verify Your Identity'}
              </Text>
              <Text style={styles.brandSubtitle}>
                {variant === 'login'
                  ? 'Access your accounts securely from anywhere in the world'
                  : variant === 'signup'
                    ? 'Start your journey to better banking today'
                    : 'Complete the verification to secure your account'}
              </Text>

              <View style={{ marginTop: 32, gap: 12 }}>
                {features.map((f, i) => (
                  <FeatureItem key={f.title} {...f} delay={600 + i * 120} />
                ))}
              </View>
            </View>
          </LinearGradient>
        )}
      </ScrollView>
    </View>
  );
};

// ========================
// STYLES
// ========================
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    flexDirection: SCREEN_WIDTH > 768 ? 'row' : 'column',
  },
  // ----- Form side -----
  formSide: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: colors.neutral[50],
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary[700],
    letterSpacing: -0.5,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  backText: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  // ----- Title -----
  titleBlock: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.neutral[900],
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: colors.neutral[600],
    marginTop: 8,
    lineHeight: 22,
  },
  altActionText: {
    fontSize: 14,
    color: colors.neutral[500],
    marginTop: 10,
  },
  altActionLink: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  // ----- Form content -----
  formContent: {
    flex: 1,
  },
  // ----- Footer -----
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: colors.neutral[400],
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  footerLink: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  footerDot: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  // ----- Brand panel (tablet) -----
  brandPanel: {
    width: '45%',
    padding: 40,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandContent: {
    zIndex: 10,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 12,
  },
  brandSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  // ----- Feature items -----
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
  },
  // ----- Decorative circles -----
  circle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circleTopLeft: {
    top: -80,
    left: -80,
  },
  circleBottomRight: {
    bottom: -100,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
  },
});

export default AuthLayout;
