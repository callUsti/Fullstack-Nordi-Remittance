import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Countries from '@nordi/shared/core/data/Countries';
import { colors } from '@nordi/shared/constants/colors';

export interface Country {
  name: string;
  code: string;
  flag: string;
  currency?: string;
  phoneCode?: string;
}

interface CountrySelectProps {
  value?: string;
  onChange?: (code: string, country: any) => void;
  compact?: boolean;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value = 'US',
  onChange,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCountry =
    Countries.find((c: any) => c.code === value) || Countries[0];

  const filteredCountries = Countries.filter(
    (c: any) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (country: any) => {
    if (onChange) {
      onChange(country.code, country);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={[styles.selectorButton, compact && styles.compactButton]}
        activeOpacity={0.7}
      >
        <Text style={styles.flagText}>{selectedCountry?.flag || '🌐'}</Text>
        {!compact && (
          <Text style={styles.codeText}>{selectedCountry?.code || value}</Text>
        )}
        <Ionicons name="chevron-down" size={14} color="#64748b" style={styles.chevron} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search countries..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Country List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item: any) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }: { item: any }) => {
              const isSelected = item.code === selectedCountry?.code;
              return (
                <TouchableOpacity
                  style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.itemFlag}>{item.flag}</Text>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, isSelected && styles.itemNameActive]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemCode}>{item.code}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={colors.primary.DEFAULT} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default CountrySelect;

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  compactButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  flagText: {
    fontSize: 20,
    marginRight: 6,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginRight: 4,
  },
  chevron: {
    marginLeft: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    padding: 4,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  itemRowSelected: {
    backgroundColor: '#eff6ff',
  },
  itemFlag: {
    fontSize: 24,
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  itemNameActive: {
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  itemCode: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
