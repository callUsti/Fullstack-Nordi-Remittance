// ============================================================================
// MODAL COMPONENT - React Native dialog & bottom-sheet modal
// ============================================================================

import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { cn } from '@utils/cn';
import { X } from 'lucide-react-native';

// ========================
// TYPES
// ========================
export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
  isBottomSheet?: boolean;
}

// ========================
// COMPONENT
// ========================
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  title,
  description,
  footer,
  className,
  isBottomSheet = false,
}) => {
  const sizeStyles: Record<ModalSize, string> = {
    sm: 'w-11/12 max-w-sm',
    md: 'w-11/12 max-w-md',
    lg: 'w-11/12 max-w-lg',
    full: 'w-full h-full m-0 rounded-none',
  };

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType={isBottomSheet ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback
        onPress={closeOnOverlayClick ? onClose : undefined}
      >
        <View
          className={cn(
            'flex-1 bg-black/60',
            isBottomSheet ? 'justify-end' : 'justify-center items-center',
          )}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              className={cn(
                'bg-white dark:bg-neutral-800 shadow-2xl',
                isBottomSheet
                  ? 'w-full rounded-t-3xl max-h-[85%] pb-6'
                  : 'rounded-2xl max-h-[85%]',
                !isBottomSheet && sizeStyles[size],
                className,
              )}
            >
              {/* Bottom Sheet Handle */}
              {isBottomSheet && (
                <View className="items-center pt-3 pb-1">
                  <View className="w-10 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
                </View>
              )}

              {/* Modal Header */}
              {(title || showCloseButton) && (
                <View className="flex-row items-center justify-between px-5 pt-4 pb-2 border-b border-neutral-100 dark:border-neutral-700/60">
                  <View className="flex-1 mr-3">
                    {title && (
                      <Text className="text-lg font-bold text-neutral-900 dark:text-white">
                        {title}
                      </Text>
                    )}
                    {description && (
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {description}
                      </Text>
                    )}
                  </View>

                  {showCloseButton && (
                    <TouchableOpacity
                      onPress={onClose}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      className="p-1 rounded-full bg-neutral-100 dark:bg-neutral-700 active:bg-neutral-200"
                    >
                      <X size={18} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Body */}
              <ScrollView
                className="px-5 py-4"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>

              {/* Footer */}
              {footer && (
                <View className="px-5 pt-3 pb-2 border-t border-neutral-100 dark:border-neutral-700/60">
                  {footer}
                </View>
              )}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

export default Modal;
