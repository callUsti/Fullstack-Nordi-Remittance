// ============================================================================
// CARD COMPONENT - React Native card container with subcomponents & variants
// ============================================================================

import React, { forwardRef, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ViewProps } from 'react-native';
import { cn } from '@utils/cn';
import { createThrottle } from '@/core/network/lodash-bounce';

// ========================
// TYPES
// ========================
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  size?: CardSize;
  onPress?: () => void;
  /**
   * Time in milliseconds to throttle rapid subsequent presses. Defaults to 600ms.
   */
  throttleWait?: number;
  /**
   * Disables throttling to allow instant consecutive fires. Defaults to false.
   */
  disableThrottle?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface CardHeaderProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardTitleProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardDescriptionProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardContentProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardFooterProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

// ========================
// VARIANT STYLES
// ========================
const variantStyles: Record<CardVariant, string> = {
  default:
    'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm shadow-neutral-900/5',
  elevated:
    'bg-white dark:bg-neutral-800 shadow-md shadow-neutral-900/10 dark:shadow-neutral-950/30 border border-neutral-100 dark:border-neutral-800',
  outlined:
    'bg-transparent border-2 border-neutral-200 dark:border-neutral-700',
  filled:
    'bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/60',
  glass:
    'bg-white/80 dark:bg-neutral-900/80 border border-white/40 dark:border-neutral-700/50',
};

// ========================
// SIZE STYLES
// ========================
const sizeStyles: Record<CardSize, string> = {
  sm: 'p-3 rounded-xl',
  md: 'p-4 rounded-2xl',
  lg: 'p-5 rounded-2xl',
  xl: 'p-6 rounded-3xl',
};

// ========================
// MAIN CARD COMPONENT
// ========================
export const Card = forwardRef<View, CardProps>(
  (
    {
      variant = 'default',
      size = 'md',
      onPress,
      throttleWait = 600,
      disableThrottle = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const cardClassNames = cn(
      variantStyles[variant],
      sizeStyles[size],
      className,
    );

    const onPressRef = useRef(onPress);
    useEffect(() => {
      onPressRef.current = onPress;
    }, [onPress]);

    const handlePress = useMemo(() => {
      if (!onPress) return undefined;
      if (disableThrottle) {
        return () => onPressRef.current?.();
      }
      return createThrottle(
        () => {
          onPressRef.current?.();
        },
        throttleWait,
        { leading: true, trailing: false },
      );
    }, [onPress ? true : false, disableThrottle, throttleWait]);

    useEffect(() => {
      return () => {
        if (handlePress && 'cancel' in handlePress && typeof handlePress.cancel === 'function') {
          handlePress.cancel();
        }
      };
    }, [handlePress]);

    if (onPress) {
      return (
        <TouchableOpacity
          ref={ref as any}
          activeOpacity={0.75}
          onPress={handlePress}
          className={cardClassNames}
          {...(props as any)}
        >
          {children}
        </TouchableOpacity>
      );
    }

    return (
      <View ref={ref} className={cardClassNames} {...props}>
        {children}
      </View>
    );
  },
);

Card.displayName = 'Card';

// ========================
// CARD SUBCOMPONENTS
// ========================
export const CardHeader = forwardRef<View, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={cn('mb-3', className)} {...props}>
      {children}
    </View>
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <Text
    className={cn(
      'text-lg font-bold text-neutral-900 dark:text-white',
      className,
    )}
  >
    {children}
  </Text>
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <Text
    className={cn(
      'text-sm text-neutral-500 dark:text-neutral-400 mt-1',
      className,
    )}
  >
    {children}
  </Text>
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<View, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={cn('', className)} {...props}>
      {children}
    </View>
  ),
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<View, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-700/60 flex-row items-center justify-between', className)}
      {...props}
    >
      {children}
    </View>
  ),
);
CardFooter.displayName = 'CardFooter';

export default Card;
