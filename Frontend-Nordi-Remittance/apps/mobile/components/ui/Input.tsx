// ============================================================================
// INPUT COMPONENT - React Native form input with validation and icons
// ============================================================================

import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { cn } from '@utils/cn';
import { Eye, EyeOff, AlertCircle, CheckCircle, X } from 'lucide-react-native';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

// ========================
// TYPES
// ========================
export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'flushed';

export interface InputProps extends Omit<TextInputProps, 'onChange'> {
  label?: string;
  helperText?: string;
  error?: string;
  isSuccess?: boolean;
  successMessage?: string;
  size?: InputSize;
  variant?: InputVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  isClearable?: boolean;
  onClear?: () => void;
  fullWidth?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  className?: string;
}

// ========================
// SIZE STYLES
// ========================
const sizeStyles: Record<
  InputSize,
  { container: string; input: string; label: string; helper: string; iconSize: number }
> = {
  sm: {
    container: 'h-10 px-3',
    input: 'text-xs',
    label: 'text-xs mb-1',
    helper: 'text-[11px] mt-1',
    iconSize: 16,
  },
  md: {
    container: 'h-12 px-4',
    input: 'text-sm',
    label: 'text-sm mb-1.5',
    helper: 'text-xs mt-1.5',
    iconSize: 18,
  },
  lg: {
    container: 'h-14 px-4',
    input: 'text-base',
    label: 'text-base mb-2',
    helper: 'text-sm mt-2',
    iconSize: 20,
  },
};

// ========================
// VARIANT STYLES
// ========================
const variantStyles: Record<
  InputVariant,
  { base: string; focus: string; error: string }
> = {
  default: {
    base: 'border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl',
    focus: 'border-primary-500',
    error: 'border-error-500',
  },
  filled: {
    base: 'border border-transparent bg-neutral-100 dark:bg-neutral-800 rounded-xl',
    focus: 'border-primary-500 bg-neutral-50 dark:bg-neutral-700',
    error: 'border-error-500',
  },
  flushed: {
    base: 'border-b-2 border-neutral-300 dark:border-neutral-700 bg-transparent rounded-none px-0',
    focus: 'border-primary-500',
    error: 'border-error-500',
  },
};

// ========================
// COMPONENT
// ========================
export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      helperText,
      error,
      isSuccess = false,
      successMessage,
      size = 'md',
      variant = 'default',
      leftIcon,
      rightIcon,
      isPassword = false,
      isClearable = false,
      onClear,
      fullWidth = true,
      containerClassName,
      labelClassName,
      className,
      value,
      editable = true,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const theme = useMobileTheme();

    const hasError = Boolean(error);
    const currentSize = sizeStyles[size];
    const currentVariant = variantStyles[variant];

    return (
      <View className={cn('mb-4', fullWidth && 'w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <Text
            className={cn(
              'font-medium text-neutral-800 dark:text-neutral-200',
              currentSize.label,
              hasError && 'text-error-600 dark:text-error-400',
              labelClassName,
            )}
          >
            {label}
          </Text>
        )}

        {/* Input Wrapper */}
        <View
          className={cn(
            'flex-row items-center',
            currentSize.container,
            currentVariant.base,
            isFocused && currentVariant.focus,
            hasError && currentVariant.error,
            !editable && 'opacity-60 bg-neutral-100 dark:bg-neutral-900',
            className,
          )}
        >
          {/* Left Icon */}
          {leftIcon && <View className="mr-2">{leftIcon}</View>}

          {/* Text Input */}
          <TextInput
            ref={ref}
            value={value}
            editable={editable}
            secureTextEntry={isPassword && !showPassword}
            placeholderTextColor={theme.textMuted}
            {...props}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              'flex-1 text-neutral-900 dark:text-white py-0',
              currentSize.input,
            )}
          />

          {/* Right Action Icons */}
          <View className="flex-row items-center ml-2 space-x-1">
            {/* Clear Button */}
            {isClearable && Boolean(value) && onClear && (
              <TouchableOpacity
                onPress={onClear}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="p-1"
              >
                <X size={currentSize.iconSize} color={theme.iconMuted} />
              </TouchableOpacity>
            )}

            {/* Password Toggle */}
            {isPassword && (
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="p-1"
              >
                {showPassword ? (
                  <EyeOff size={currentSize.iconSize} color={theme.iconMuted} />
                ) : (
                  <Eye size={currentSize.iconSize} color={theme.iconMuted} />
                )}
              </TouchableOpacity>
            )}

            {/* Error Icon */}
            {hasError && !isPassword && (
              <AlertCircle size={currentSize.iconSize} color={theme.danger} />
            )}

            {/* Success Icon */}
            {isSuccess && !hasError && !isPassword && (
              <CheckCircle size={currentSize.iconSize} color="#10B981" />
            )}

            {/* Custom Right Icon */}
            {rightIcon && !hasError && !isSuccess && rightIcon}
          </View>
        </View>

        {/* Error Message */}
        {hasError && (
          <View className="flex-row items-center mt-1">
            <Text
              className={cn(
                'text-error-600 dark:text-error-400 font-medium',
                currentSize.helper,
              )}
            >
              {error}
            </Text>
          </View>
        )}

        {/* Success Message */}
        {!hasError && isSuccess && successMessage && (
          <Text
            className={cn(
              'text-success-600 dark:text-success-400 font-medium',
              currentSize.helper,
            )}
          >
            {successMessage}
          </Text>
        )}

        {/* Helper Text */}
        {!hasError && !isSuccess && helperText && (
          <Text
            className={cn(
              'text-neutral-500 dark:text-neutral-400',
              currentSize.helper,
            )}
          >
            {helperText}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';

export default Input;
