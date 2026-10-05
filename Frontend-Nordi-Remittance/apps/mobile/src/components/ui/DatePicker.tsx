// ============================================================================
// DATE PICKER COMPONENT - Native Date Picker with formatted input trigger
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Calendar as CalendarIcon, X } from 'lucide-react-native';
import { cn } from '@utils/cn';

export interface DatePickerProps {
  label?: string;
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  isClearable?: boolean;
  className?: string;
  containerClassName?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  selected,
  onChange,
  placeholder = 'Select date',
  error,
  helperText,
  minimumDate,
  maximumDate,
  isClearable = true,
  className,
  containerClassName,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(selected || new Date());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    date?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && date) {
        onChange(date);
      }
    } else {
      if (date) {
        setTempDate(date);
      }
    }
  };

  const handleIosConfirm = () => {
    setShowPicker(false);
    onChange(tempDate);
  };

  return (
    <View className={cn('mb-4 w-full', containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1.5">
          {label}
        </Text>
      )}

      {/* Trigger Button */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => {
          setTempDate(selected || new Date());
          setShowPicker(true);
        }}
        className={cn(
          'h-12 px-4 flex-row items-center justify-between rounded-xl border bg-white dark:bg-neutral-800',
          error
            ? 'border-error-500'
            : 'border-neutral-300 dark:border-neutral-700',
          className,
        )}
      >
        <View className="flex-row items-center flex-1">
          <CalendarIcon size={18} color="#64748B" />
          <Text
            className={cn(
              'ml-2.5 text-sm',
              selected
                ? 'text-neutral-900 dark:text-white font-medium'
                : 'text-neutral-400',
            )}
          >
            {selected ? formatDate(selected) : placeholder}
          </Text>
        </View>

        {isClearable && selected && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="p-1"
          >
            <X size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Error or Helper text */}
      {error ? (
        <Text className="text-xs text-error-600 dark:text-error-400 mt-1 font-medium">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {helperText}
        </Text>
      ) : null}

      {/* Native DateTimePicker for Android */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selected || new Date()}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleDateChange}
        />
      )}

      {/* Modal DateTimePicker for iOS */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white dark:bg-neutral-800 rounded-t-3xl p-5 pb-8 shadow-xl">
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text className="text-neutral-500 text-base">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-neutral-900 dark:text-white font-bold text-base">
                  {label || 'Select Date'}
                </Text>
                <TouchableOpacity onPress={handleIosConfirm}>
                  <Text className="text-primary-600 font-bold text-base">Done</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={handleDateChange}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default DatePicker;
