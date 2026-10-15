// ============================================================================
// SEARCH INPUT - React Native search input with clear and filter options
// ============================================================================

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

export interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onChangeText?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  isLoading?: boolean;
  showClearButton?: boolean;
  showFilterButton?: boolean;
  onFilterClick?: () => void;
  autoFocus?: boolean;
  debounceMs?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export interface SearchSuggestion {
  id: string;
  label: string;
  category?: string;
}

export type SearchBarProps = SearchInputProps;

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  onChangeText,
  onSearch,
  placeholder = 'Search...',
  size = 'md',
  variant = 'default',
  isLoading = false,
  showClearButton = true,
  showFilterButton = false,
  onFilterClick,
  autoFocus = false,
  style,
}) => {
  const theme = useMobileTheme();

  const handleChange = (text: string) => {
    if (onChangeText) onChangeText(text);
    if (onChange) onChange(text);
  };

  const handleClear = () => {
    if (onChangeText) onChangeText('');
    if (onChange) onChange('');
  };

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;
  const height = size === 'sm' ? 36 : size === 'lg' ? 48 : 42;

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: variant === 'filled' ? theme.surfaceAlt : theme.surface,
          borderColor: variant === 'outlined' ? theme.primary : theme.border,
        },
        style,
      ]}
    >
      <Ionicons name="search-outline" size={iconSize} color={theme.textMuted} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={handleChange}
        onSubmitEditing={() => onSearch?.(value)}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        autoFocus={autoFocus}
        style={[
          styles.input,
          {
            color: theme.text,
            fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 14,
          },
        ]}
      />
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.primary} style={styles.actionIcon} />
      ) : showClearButton && value.length > 0 ? (
        <TouchableOpacity onPress={handleClear} style={styles.actionIcon}>
          <Ionicons name="close-circle" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      ) : null}
      {showFilterButton ? (
        <TouchableOpacity onPress={onFilterClick} style={styles.filterBtn}>
          <Ionicons name="options-outline" size={18} color={theme.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export const SearchBar = SearchInput;
export default SearchInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  actionIcon: {
    marginLeft: 6,
    padding: 2,
  },
  filterBtn: {
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#CBD5E1',
  },
});
