import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import categories from '@/constants/MoreCategory';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

const MoreOptionScreen = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const toggleCategory = (title: string) => {
    setActiveCategory(activeCategory === title ? null : title);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          {/* Replace with a compatible icon */}
          <FontAwesome name="search" size={16} color={theme.iconMuted} />
          <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor={theme.textMuted} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollableContainer} showsVerticalScrollIndicator={false}>
        {categories.map((category, index) => (
          <View key={index} style={styles.categoryContainer}>
            <TouchableOpacity onPress={() => toggleCategory(category.title)} style={styles.categoryHeader}>
              <View style={styles.categoryHeaderText}>
                {category.icon}
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </View>
              <View
                style={{
                  backgroundColor: theme.surface,
                  borderRadius: 50,
                  padding: 8,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <MaterialIcons name="keyboard-arrow-down" size={24} color={activeCategory === category.title ? theme.primary : theme.text} />
              </View>
            </TouchableOpacity>

            {activeCategory === category.title && (
              <View style={styles.subOptionsContainer}>
                {category.subOptions.map((subOption, subIndex) => (
                  <TouchableOpacity
                    key={subIndex}
                    style={styles.subOption}
                    onPress={() => router.push(subOption.link)}
                  >
                    {subOption.icon}
                    <Text style={styles.subOptionText}>{subOption.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton}>
        <MaterialIcons name="logout" size={24} color="white" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useMobileTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    marginTop: 30,
    padding: 16
  },
  searchContainer: {
    marginBottom: 16
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: theme.border,
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.surfaceAlt
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 18,
    color: theme.text,
  },
  scrollableContainer: {
    paddingBottom: 16 // Space at the bottom of the ScrollView
  },
  categoryContainer: {
    marginBottom: 16,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 16,
    padding: 10
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryHeaderText: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  categoryTitle: {
    fontSize: 14,
    marginLeft: 16,
    color: theme.text
  },
  subOptionsContainer: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  subOption: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 8,
    width: '23%',
    marginBottom: 16,
    marginHorizontal: '1%'
  },
  subOptionText: {
    marginTop: 8,
    fontSize: 10,
    color: theme.text
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16
  },
  logoutText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 8
  }
});

export default MoreOptionScreen;
