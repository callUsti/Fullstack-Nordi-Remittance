// ============================================================================
// BADGE COMPONENT - Status indicators and labels in React Native
// ============================================================================

import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@utils/cn';

// ========================
// TYPES
// ========================
export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'danger'
  | 'neutral'
  | 'info'
  | 'outline';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps extends ViewProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: string;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

// ========================
// VARIANT STYLES
// ========================
const variantContainerStyles: Record<BadgeVariant, string> = {
  default:
    'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
  neutral:
    'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
  primary:
    'bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800',
  secondary:
    'bg-secondary-50 dark:bg-secondary-950/40 border border-secondary-200 dark:border-secondary-800',
  success:
    'bg-success-50 dark:bg-success-950/40 border border-success-200 dark:border-success-800',
  warning:
    'bg-warning-50 dark:bg-warning-950/40 border border-warning-200 dark:border-warning-800',
  error:
    'bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800',
  danger:
    'bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800',
  info:
    'bg-info-50 dark:bg-info-950/40 border border-info-200 dark:border-info-800',
  outline:
    'bg-transparent border border-neutral-300 dark:border-neutral-600',
};

const variantTextStyles: Record<BadgeVariant, string> = {
  default: 'text-neutral-700 dark:text-neutral-300',
  neutral: 'text-neutral-700 dark:text-neutral-300',
  primary: 'text-primary-700 dark:text-primary-300 font-semibold',
  secondary: 'text-secondary-700 dark:text-secondary-300 font-semibold',
  success: 'text-success-700 dark:text-success-300 font-semibold',
  warning: 'text-warning-700 dark:text-warning-300 font-semibold',
  error: 'text-error-700 dark:text-error-300 font-semibold',
  danger: 'text-error-700 dark:text-error-300 font-semibold',
  info: 'text-info-700 dark:text-info-300 font-semibold',
  outline: 'text-neutral-700 dark:text-neutral-300',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-neutral-500',
  neutral: 'bg-neutral-500',
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  danger: 'bg-error-500',
  info: 'bg-info-500',
  outline: 'bg-neutral-500',
};

// ========================
// SIZE STYLES
// ========================
const sizeContainerStyles: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 rounded-full',
  sm: 'px-2 py-0.5 rounded-full',
  md: 'px-2.5 py-1 rounded-full',
  lg: 'px-3 py-1.5 rounded-full',
};

const sizeTextStyles: Record<BadgeSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
};

const dotSizeStyles: Record<BadgeSize, string> = {
  xs: 'w-1 h-1 mr-1',
  sm: 'w-1.5 h-1.5 mr-1.5',
  md: 'w-2 h-2 mr-1.5',
  lg: 'w-2.5 h-2.5 mr-2',
};

// ========================
// COMPONENT
// ========================
export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  dotColor,
  children,
  className,
  textClassName,
  ...props
}) => {
  return (
    <View
      className={cn(
        'flex-row items-center self-start justify-center',
        variantContainerStyles[variant],
        sizeContainerStyles[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <View
          className={cn(
            'rounded-full',
            dotSizeStyles[size],
            dotColor || dotColors[variant],
          )}
        />
      )}
      {typeof children === 'string' ? (
        <Text
          className={cn(
            'font-medium text-center',
            variantTextStyles[variant],
            sizeTextStyles[size],
            textClassName,
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
};

export interface StatusBadgeProps {
  status:
    | 'completed'
    | 'success'
    | 'pending'
    | 'processing'
    | 'failed'
    | 'error'
    | 'frozen'
    | 'active'
    | 'closed'
    | string;
  size?: BadgeSize;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  className,
}) => {
  const normalized = status.toLowerCase();

  let variant: BadgeVariant = 'default';
  let label = status;

  switch (normalized) {
    case 'completed':
    case 'success':
    case 'active':
      variant = 'success';
      label = normalized === 'active' ? 'Active' : 'Completed';
      break;
    case 'pending':
    case 'processing':
      variant = 'warning';
      label = normalized === 'processing' ? 'Processing' : 'Pending';
      break;
    case 'failed':
    case 'error':
    case 'rejected':
      variant = 'error';
      label = normalized === 'rejected' ? 'Rejected' : 'Failed';
      break;
    case 'frozen':
    case 'locked':
      variant = 'info';
      label = 'Frozen';
      break;
    case 'closed':
      variant = 'default';
      label = 'Closed';
      break;
  }

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {label}
    </Badge>
  );
};

export default Badge;
