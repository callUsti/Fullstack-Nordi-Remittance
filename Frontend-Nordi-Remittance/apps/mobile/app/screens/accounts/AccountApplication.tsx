// ============================================================================
// ACCOUNT APPLICATION SCREEN — Apply for new currency pockets / business accounts
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useCreateWallet } from '@nordi/shared/hooks/api-queries/useAccounts';

const CURRENCIES = [
  { code: 'USD', name: 'United States Dollar', symbol: '$', flag: '🇺🇸', popular: true },
  { code: 'EUR', name: 'Euro (SEPA Instant)', symbol: '€', flag: '🇪🇺', popular: true },
  { code: 'GBP', name: 'British Pound (Faster Payments)', symbol: '£', flag: '🇬🇧', popular: true },
  { code: 'CAD', name: 'Canadian Dollar (Interac)', symbol: 'CA$', flag: '🇨🇦', popular: false },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', popular: false },
  { code: 'NGN', name: 'Nigerian Naira (NIBSS)', symbol: '₦', flag: '🇳🇬', popular: true },
];

export default function AccountApplicationScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const createWalletMutation = useCreateWallet();

  const handleApply = () => {
    createWalletMutation.mutate(
      { currency: selectedCurrency as any, walletType: accountType },
      {
        onSuccess: () => {
          Alert.alert(
            'Account Activated',
            `Your new ${selectedCurrency} ${accountType} pocket has been opened and is ready for deposits!`,
            [{ text: 'View Accounts', onPress: () => router.replace('/screens/accounts' as any) }]
          );
        },
        onError: (err: any) => {
          Alert.alert('Application Failed', err?.message || 'Could not create account at this time.');
        },
      }
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Open New Currency Pocket"
        subtitle="Zero opening fees • Instant local IBAN / Account Number"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionTitle}>Account Type</Text>
        <View style={s.typeToggleRow}>
          <TouchableOpacity
            style={[s.typeCard, accountType === 'personal' && s.typeCardActive]}
            onPress={() => setAccountType('personal')}
          >
            <Ionicons
              name="person"
              size={20}
              color={accountType === 'personal' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[s.typeTitle, accountType === 'personal' && s.typeTitleActive]}>
              Personal Pocket
            </Text>
            <Text style={s.typeSub}>For everyday spending & remittance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.typeCard, accountType === 'business' && s.typeCardActive]}
            onPress={() => setAccountType('business')}
          >
            <Ionicons
              name="briefcase"
              size={20}
              color={accountType === 'business' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[s.typeTitle, accountType === 'business' && s.typeTitleActive]}>
              Business Pocket
            </Text>
            <Text style={s.typeSub}>For invoicing & merchant payouts</Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Select Currency</Text>
        {CURRENCIES.map((curr) => {
          const isSelected = selectedCurrency === curr.code;
          return (
            <Card
              key={curr.code}
              style={[s.currencyCard, isSelected && s.currencyCardActive]}
            >
              <TouchableOpacity
                style={s.currencyContent}
                onPress={() => setSelectedCurrency(curr.code)}
              >
                <Text style={s.flagText}>{curr.flag}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={s.currCode}>{curr.code}</Text>
                    {curr.popular && (
                      <Badge variant="primary" size="sm" style={{ marginLeft: 8 }}>
                        Instant Wire
                      </Badge>
                    )}
                  </View>
                  <Text style={s.currName}>{curr.name}</Text>
                </View>

                <View style={[s.radioCircle, isSelected && s.radioCircleSelected]}>
                  {isSelected && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            </Card>
          );
        })}

        <Button
          title={createWalletMutation.isPending ? 'Activating Pocket...' : `Create ${selectedCurrency} Pocket`}
          variant="primary"
          size="lg"
          onPress={handleApply}
          disabled={createWalletMutation.isPending}
          style={s.submitBtn}
        />
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 10,
    },
    typeToggleRow: {
      flexDirection: 'row',
      gap: 12,
    },
    typeCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: 14,
    },
    typeCardActive: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}08`,
    },
    typeTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginTop: 8,
      marginBottom: 2,
    },
    typeTitleActive: {
      color: theme.colors.primary,
    },
    typeSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    currencyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    currencyCardActive: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}06`,
    },
    currencyContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    flagText: {
      fontSize: 24,
    },
    currCode: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    currName: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleSelected: {
      borderColor: theme.colors.primary,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    submitBtn: {
      marginTop: 20,
    },
  });
}
