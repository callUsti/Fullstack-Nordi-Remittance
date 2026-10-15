// ============================================================================
// MORE OPTIONS HUB — Complete Feature Catalog & Service Navigator
// Clean accordion and search directory linking to all 20+ mobile features
// ============================================================================
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import categories, { MoreCategoryGroup } from '@/constants/MoreCategory';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/shared/SearchInput';

export default function MoreOptionScreen() {
  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0].title);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const toggleCategory = (title: string) => {
    setActiveCategory(activeCategory === title ? null : title);
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories
      .map(cat => ({
        ...cat,
        subOptions: cat.subOptions.filter(
          sub => sub.title.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.subOptions.length > 0);
  }, [search]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="All Services & Features"
        subtitle="Explore banking, remittance, cards, credit & settings"
      />

      <View style={styles.searchWrapper}>
        <SearchInput
          placeholder="Search features (e.g. wire, loans, kyc, cards)..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollableContainer} showsVerticalScrollIndicator={false}>
        {filteredCategories.map((category) => {
          const isOpen = activeCategory === category.title || !!search.trim();
          return (
            <Card key={category.title} variant="default" style={styles.categoryCard}>
              <TouchableOpacity
                onPress={() => toggleCategory(category.title)}
                style={styles.categoryHeader}
                activeOpacity={0.7}
              >
                <View style={styles.headerLeft}>
                  <View style={styles.categoryIconBox}>
                    <Ionicons name={category.iconName as any} size={18} color={theme.primary} />
                  </View>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                </View>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={isOpen ? theme.primary : theme.textMuted}
                />
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.subOptionsContainer}>
                  {category.subOptions.map((subOption) => (
                    <TouchableOpacity
                      key={subOption.title}
                      style={styles.subOption}
                      onPress={() => router.push(subOption.link as any)}
                      activeOpacity={0.6}
                    >
                      <View style={styles.subOptionLeft}>
                        <Ionicons name={subOption.iconName as any} size={18} color={theme.text} />
                        <Text style={styles.subOptionText}>{subOption.title}</Text>
                      </View>
                      <View style={styles.subOptionRight}>
                        {subOption.badge ? (
                          <Badge variant="info">{subOption.badge}</Badge>
                        ) : null}
                        <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>
          );
        })}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure you want to log out of Nordi Remit?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log Out', style: 'destructive', onPress: () => router.replace('/(auth)/login') },
            ]);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out of Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    searchWrapper: {
      paddingHorizontal: 16,
      marginTop: 8,
      marginBottom: 6,
    },
    scrollableContainer: {
      paddingHorizontal: 16,
      paddingBottom: 40,
      gap: 10,
    },
    categoryCard: {
      overflow: 'hidden',
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    categoryIconBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    subOptionsContainer: {
      borderTopWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
    },
    subOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderBottomWidth: 0.5,
      borderColor: theme.border,
    },
    subOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    subOptionText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.text,
    },
    subOptionRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 10,
    },
    logoutText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ef4444',
    },
  });
