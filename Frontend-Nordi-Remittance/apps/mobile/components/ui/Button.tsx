// ============================================================================
// BUTTON COMPONENT - React Native animated button with multiple variants
// ============================================================================

import React, { forwardRef, useEffect, useMemo, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { cn } from '@utils/cn';
import { createThrottle } from '@/core/network/lodash-bounce';

// ========================
// TYPES
// ========================
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
  onClick?: (e?: any) => void;
  /**
   * Time in milliseconds to throttle rapid subsequent presses. Defaults to 600ms.
   */
  throttleWait?: number;
  /**
   * Disables throttling to allow instant consecutive fires. Defaults to false.
   */
  disableThrottle?: boolean;
}

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label'?: string;
}

// ========================
// VARIANT STYLES
// ========================
const variantContainerStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 active:bg-primary-700 shadow-sm shadow-primary-500/20',
  secondary: 'bg-secondary-500 active:bg-secondary-600 shadow-sm shadow-secondary-500/20',
  outline: 'bg-transparent border-2 border-primary-500 active:bg-primary-50 dark:active:bg-primary-950/30',
  ghost: 'bg-transparent active:bg-neutral-100 dark:active:bg-neutral-800',
  danger: 'bg-error-500 active:bg-error-600 shadow-sm shadow-error-500/20',
  success: 'bg-success-500 active:bg-success-600 shadow-sm shadow-success-500/20',
  link: 'bg-transparent p-0 h-auto',
};

const variantTextStyles: Record<ButtonVariant, string> = {
  primary: 'text-white font-semibold',
  secondary: 'text-white font-semibold',
  outline: 'text-primary-500 dark:text-primary-400 font-semibold',
  ghost: 'text-neutral-700 dark:text-neutral-200 font-medium',
  danger: 'text-white font-semibold',
  success: 'text-white font-semibold',
  link: 'text-primary-500 dark:text-primary-400 underline font-medium',
};

// ========================
// SIZE STYLES
// ========================
const sizeContainerStyles: Record<ButtonSize, string> = {
  xs: 'h-8 px-2.5 rounded-md gap-1.5',
  sm: 'h-10 px-3.5 rounded-lg gap-2',
  md: 'h-12 px-4 rounded-xl gap-2',
  lg: 'h-14 px-5 rounded-xl gap-2.5',
  xl: 'h-16 px-6 rounded-2xl gap-3',
};

const sizeTextStyles: Record<ButtonSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const spinnerColors: Record<ButtonVariant, string> = {
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  outline: '#1E3A8A',
  ghost: '#1E3A8A',
  danger: '#FFFFFF',
  success: '#FFFFFF',
  link: '#1E3A8A',
};

// ========================
// COMPONENT
// ========================
export const Button = forwardRef<View, ButtonProps>(
  (
    {
      title,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      textClassName,
      disabled,
      onClick,
      onPress,
      throttleWait = 600,
      disableThrottle = false,
      ...props
    },
    ref,
  ) => {
    const isButtonDisabled = disabled || isDisabled || isLoading;
    const content = children ?? title;

    const onPressHandler = onPress || onClick;
    const onPressRef = useRef(onPressHandler);
    useEffect(() => {
      onPressRef.current = onPressHandler;
    }, [onPressHandler]);

    const handlePress = useMemo(() => {
      if (!onPressHandler) return undefined;
      if (disableThrottle) {
        return (e: any) => onPressRef.current?.(e);
      }
      return createThrottle(
        (e: any) => {
          onPressRef.current?.(e);
        },
        throttleWait,
        { leading: true, trailing: false },
      );
    }, [onPressHandler ? true : false, disableThrottle, throttleWait]);

    useEffect(() => {
      return () => {
        if (handlePress && 'cancel' in handlePress && typeof handlePress.cancel === 'function') {
          handlePress.cancel();
        }
      };
    }, [handlePress]);

    return (
      <TouchableOpacity
        ref={ref as any}
        activeOpacity={0.8}
        disabled={isButtonDisabled}
        onPress={handlePress}
        className={cn(
          'flex-row items-center justify-center',
          variantContainerStyles[variant],
          variant !== 'link' && sizeContainerStyles[size],
          fullWidth && 'w-full',
          isButtonDisabled && 'opacity-50',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={spinnerColors[variant]}
            className="mr-2"
          />
        ) : (
          leftIcon && <View className="mr-2">{leftIcon}</View>
        )}

        {typeof content === 'string' ? (
          <Text
            className={cn(
              variantTextStyles[variant],
              sizeTextStyles[size],
              textClassName,
            )}
          >
            {content}
          </Text>
        ) : (
          content
        )}

        {!isLoading && rightIcon && <View className="ml-2">{rightIcon}</View>}
      </TouchableOpacity>
    );
  },
);

Button.displayName = 'Button';

// ========================
// ICON BUTTON
// ========================
export const IconButton = forwardRef<View, IconButtonProps>(
  ({ icon, size = 'md', className, ...props }, ref) => {
    const iconSizeStyles: Record<ButtonSize, string> = {
      xs: 'w-8 h-8 p-0 rounded-md',
      sm: 'w-10 h-10 p-0 rounded-lg',
      md: 'w-12 h-12 p-0 rounded-xl',
      lg: 'w-14 h-14 p-0 rounded-xl',
      xl: 'w-16 h-16 p-0 rounded-2xl',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn(iconSizeStyles[size], className)}
        {...props}
      >
        {icon}
      </Button>
    );
  },
);

IconButton.displayName = 'IconButton';

export default Button;
