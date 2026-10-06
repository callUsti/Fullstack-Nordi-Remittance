// ============================================================================
// TOAST CONTAINER COMPONENT - React Native floating toast banner
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { useToastStore, Toast, ToastType } from '@nordi/shared/store/toast.store';
import { cn } from '@utils/cn';

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={20} color="#10B981" />;
    case 'error':
      return <XCircle size={20} color="#EF4444" />;
    case 'warning':
      return <AlertTriangle size={20} color="#F59E0B" />;
    case 'info':
    default:
      return <Info size={20} color="#3B82F6" />;
  }
};

const toastBgMap: Record<ToastType, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800',
  error: 'bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800',
  warning: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800',
  info: 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800',
};

const toastTextMap: Record<ToastType, string> = {
  success: 'text-emerald-900 dark:text-emerald-100',
  error: 'text-red-900 dark:text-red-100',
  warning: 'text-amber-900 dark:text-amber-100',
  info: 'text-blue-900 dark:text-blue-100',
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  return (
    <View
      className={cn(
        'flex-row items-center justify-between p-3.5 rounded-2xl border shadow-lg shadow-neutral-900/10 mb-2.5',
        toastBgMap[toast.type],
      )}
    >
      <View className="flex-row items-center flex-1 mr-2">
        <ToastIcon type={toast.type} />
        <Text
          className={cn(
            'ml-3 text-sm font-medium flex-1',
            toastTextMap[toast.type],
          )}
        >
          {toast.message}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => onDismiss(toast.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="p-1 rounded-full bg-black/5 dark:bg-white/10"
      >
        <X size={16} color="#64748B" />
      </TouchableOpacity>
    </View>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <SafeAreaView
      pointerEvents="box-none"
      className="absolute top-12 left-4 right-4 z-50"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </SafeAreaView>
  );
};

export default ToastContainer;
