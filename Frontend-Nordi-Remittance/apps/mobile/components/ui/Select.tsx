// ============================================================================
// SELECT COMPONENT - Native dropdown selector with modal search in React Native
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { ChevronDown, Check, Search, X } from 'lucide-react-native';
import { cn } from '@utils/cn';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface SelectProps<T = string> {
  label?: string;
  options: SelectOption<T>[];
  value?: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

export function Select<T = string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option',
  error,
  helperText,
  searchable = true,
  disabled = false,
  className,
  containerClassName,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.description &&
          opt.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : options;

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
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
        disabled={disabled}
        onPress={() => setIsOpen(true)}
        className={cn(
          'h-12 px-4 flex-row items-center justify-between rounded-xl border bg-white dark:bg-neutral-800',
          error
            ? 'border-error-500'
            : 'border-neutral-300 dark:border-neutral-700',
          disabled && 'opacity-50 bg-neutral-100 dark:bg-neutral-900',
          className,
        )}
      >
        <View className="flex-row items-center flex-1 mr-2">
          {selectedOption?.icon && (
            <View className="mr-2.5">{selectedOption.icon}</View>
          )}
          <Text
            numberOfLines={1}
            className={cn(
              'text-sm',
              selectedOption
                ? 'text-neutral-900 dark:text-white font-medium'
                : 'text-neutral-400',
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>

        <ChevronDown size={18} color="#64748B" />
      </TouchableOpacity>

      {error ? (
        <Text className="text-xs text-error-600 dark:text-error-400 mt-1 font-medium">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {helperText}
        </Text>
      ) : null}

      {/* Modal Picker */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-neutral-800 rounded-t-3xl max-h-[80%] p-5 pb-8 shadow-2xl">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-700">
              <Text className="text-base font-bold text-neutral-900 dark:text-white">
                {label || 'Select'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="p-1 rounded-full bg-neutral-100 dark:bg-neutral-700"
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            {searchable && (
              <View className="flex-row items-center h-10 px-3 mt-3 mb-2 rounded-xl bg-neutral-100 dark:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-700">
                <Search size={16} color="#64748B" className="mr-2" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor="#94A3B8"
                  className="flex-1 text-sm text-neutral-900 dark:text-white py-0"
                />
              </View>
            )}

            {/* List of Options */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(_, index) => String(index)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleSelect(item.value)}
                    className={cn(
                      'flex-row items-center justify-between py-3.5 px-3 rounded-xl',
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-950/40'
                        : 'active:bg-neutral-50 dark:active:bg-neutral-700/40',
                    )}
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      {item.icon && <View className="mr-3">{item.icon}</View>}
                      <View className="flex-1">
                        <Text
                          className={cn(
                            'text-sm',
                            isSelected
                              ? 'text-primary-700 dark:text-primary-300 font-bold'
                              : 'text-neutral-800 dark:text-neutral-200 font-medium',
                          )}
                        >
                          {item.label}
                        </Text>
                        {item.description && (
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {item.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    {isSelected && <Check size={18} color="#1E3A8A" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

export default Select;
