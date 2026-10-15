// ============================================================================
// TOAST CONTAINER COMPONENT — Smooth drop-down & slide-up animated notifications
// ============================================================================

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react-native';
import { useToastStore, Toast, ToastType } from '@nordi/shared/store/toast.store';
import { cn } from '@utils/cn';

// ========================
// THEME & ICONS MAP
// ========================
const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={20} color="#10B981" />;
    case 'error':
      return <AlertOctagon size={20} color="#EF4444" />;
    case 'warning':
      return <AlertTriangle size={20} color="#F59E0B" />;
    case 'info':
    default:
      return <Info size={20} color="#3B82F6" />;
  }
};

const toastConfig: Record<
  ToastType,
  {
    bg: string;
    border: string;
    text: string;
    title: string;
  }
> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/95',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-900 dark:text-emerald-100',
    title: 'Success',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/95',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-900 dark:text-red-100',
    title: 'Error',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/95',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-900 dark:text-amber-100',
    title: 'Attention',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/95',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-100',
    title: 'Notice',
  },
};

// ========================
// ANIMATED TOAST ITEM
// ========================
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);

  const cfg = toastConfig[toast.type] || toastConfig.info;

  const dismissWithAnimation = useCallback(() => {
    if (isDismissing.current) return;
    isDismissing.current = true;

    // Slide smoothly right back up and fade out
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  }, [onDismiss, opacity, toast.id, translateY]);

  useEffect(() => {
    // 1. Drop down from top
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Slide right back up after toast duration
    const duration = toast.duration ?? (toast.type === 'error' ? 4500 : 3500);
    const dismissTimer = setTimeout(() => {
      dismissWithAnimation();
    }, Math.max(duration - 300, 1500));

    return () => clearTimeout(dismissTimer);
  }, [dismissWithAnimation, opacity, toast.duration, toast.type, translateY]);

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        className={cn(
          'flex-row items-center justify-between px-4 py-3.5 rounded-2xl border shadow-xl',
          cfg.bg,
          cfg.border,
        )}
        style={styles.toastShadow}
      >
        <View className="flex-row items-start flex-1 mr-2.5">
          <View className="mt-0.5">
            <ToastIcon type={toast.type} />
          </View>
          <View className="ml-3 flex-1">
            <Text
              className={cn(
                'text-sm font-semibold tracking-tight',
                cfg.text,
              )}
              numberOfLines={3}
            >
              {toast.message}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={dismissWithAnimation}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="p-1 rounded-full bg-black/5 dark:bg-white/10 active:opacity-70"
          accessibilityLabel="Dismiss notification"
        >
          <X size={15} color="#64748B" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ========================
// TOAST CONTAINER
// ========================
export const ToastContainer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: Math.max(insets.top + (Platform.OS === 'android' ? 12 : 6), 16),
        },
      ]}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toastWrapper: {
    marginBottom: 8,
  },
  toastShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default ToastContainer;
