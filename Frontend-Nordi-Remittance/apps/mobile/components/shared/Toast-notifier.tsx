import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  duration = 3500,
  onHide,
}) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10b981',
          icon: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          backgroundColor: '#ef4444',
          icon: 'alert-circle' as const,
        };
      case 'warning':
        return {
          backgroundColor: '#f59e0b',
          icon: 'warning' as const,
        };
      case 'info':
      default:
        return {
          backgroundColor: '#3b82f6',
          icon: 'information-circle' as const,
        };
    }
  };

  const config = getToastConfig();

  return (
    <View pointerEvents="box-none" style={styles.outerContainer}>
      <Animated.View
        entering={FadeInUp.springify()}
        exiting={FadeOutUp}
        style={[styles.toast, { backgroundColor: config.backgroundColor }]}
      >
        <Ionicons name={config.icon} size={20} color="#ffffff" style={styles.icon} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
};

export default Toast;

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    maxWidth: '92%',
  },
  icon: {
    marginRight: 10,
  },
  message: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    flexShrink: 1,
  },
});