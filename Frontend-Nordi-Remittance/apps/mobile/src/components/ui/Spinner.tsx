// ============================================================================
// SPINNER COMPONENT - React Native activity indicators & branded screen loader
// ============================================================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Animated,
  Easing,
  ViewProps,
} from 'react-native';
import { cn } from '@utils/cn';

// ========================
// TYPES
// ========================
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'primary' | 'secondary' | 'white';

export interface SpinnerProps extends ViewProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  className?: string;
}

const colorMap: Record<SpinnerVariant, string> = {
  default: '#64748B',
  primary: '#1E3A8A',
  secondary: '#F59E0B',
  white: '#FFFFFF',
};

const rnSizeMap: Record<SpinnerSize, 'small' | 'large'> = {
  xs: 'small',
  sm: 'small',
  md: 'small',
  lg: 'large',
  xl: 'large',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  label,
  className,
  ...props
}) => {
  return (
    <View
      className={cn('flex-row items-center justify-center space-x-2', className)}
      {...props}
    >
      <ActivityIndicator size={rnSizeMap[size]} color={colorMap[variant]} />
      {label && (
        <Text
          className={cn(
            'font-medium ml-2',
            variant === 'white'
              ? 'text-white'
              : 'text-neutral-700 dark:text-neutral-300',
            size === 'xs' || size === 'sm' ? 'text-xs' : 'text-sm',
          )}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

export interface LogoSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const LogoSpinner: React.FC<LogoSpinnerProps> = ({
  size = 'md',
  label = 'Loading...',
  className,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dimension = size === 'sm' ? 44 : size === 'md' ? 60 : 80;

  return (
    <View className={cn('items-center justify-center p-4', className)}>
      <View
        style={{ width: dimension, height: dimension }}
        className="items-center justify-center relative"
      >
        <Animated.View
          style={{
            width: dimension,
            height: dimension,
            transform: [{ rotate: spin }],
          }}
          className="rounded-full border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 absolute"
        />
        <Text className="text-primary-700 dark:text-primary-300 font-extrabold text-base">
          N
        </Text>
      </View>
      {label && (
        <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-3 text-center">
          {label}
        </Text>
      )}
    </View>
  );
};

export interface ScreenLoaderProps {
  message?: string;
}

export const ScreenLoader: React.FC<ScreenLoaderProps> = ({
  message = 'Processing request...',
}) => {
  return (
    <View className="flex-1 items-center justify-center bg-white/90 dark:bg-neutral-900/90 p-6">
      <LogoSpinner size="lg" label={message} />
    </View>
  );
};

export default Spinner;
