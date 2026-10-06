import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

const Transfer = () => {
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const majorTransferOptions: { id: number; label: string; icon: string; route: Href; color: string }[] = [
    { id: 1, label: 'Access-to-Access', icon: 'bank', route: '/screens/Transactions/AccessToAccess', color: '#2563eb' },
    { id: 2, label: 'Access-to-Others', icon: 'users', route: '/screens/Transactions/AccessToOthers', color: '#16a34a' },
    { id: 3, label: 'International Transfers', icon: 'globe', route: '/screens/Transactions/AccessInternational', color: '#000080' },
    { id: 4, label: 'Access-SwiftPAY', icon: 'bolt', route: '/screens/Transactions/AccessSwiftPay', color: '#ef4444' },
    { id: 5, label: 'Access-to-crypto', icon: 'btc', route: '/screens/Transactions/AccessCrypto', color: '#F7931A' }
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 40, padding: 20 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Transfer Options</Text>
      </View>

      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Major Transfer Options */}
        {majorTransferOptions.map(option => (
          <TouchableOpacity key={option.id} style={styles.option} onPress={() => router.push(option.route)}>
            <View style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}>
              <FontAwesome name={option.icon as any} size={24} color={option.color} />
            </View>
            <Text style={styles.optionText}>{option.label}</Text>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </GestureHandlerRootView>
  );
};

const createStyles = (theme: ReturnType<typeof useMobileTheme>) => StyleSheet.create({
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginLeft: 15
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: 12
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  optionText: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.text
  },
});

export default Transfer;
