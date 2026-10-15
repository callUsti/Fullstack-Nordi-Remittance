// ============================================================================
// ADD BENEFICIARY SCREEN — Save new bank recipient
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AddBeneficiaryScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [currency, setCurrency] = useState('USD');

  const handleSave = () => {
    if (!name || !accountNumber) {
      Alert.alert('Required Fields', 'Please enter beneficiary name and account number.');
      return;
    }

    Alert.alert(
      'Beneficiary Saved',
      `${name} has been added to your saved remittance contacts.`,
      [{ text: 'Done', onPress: () => router.replace('/screens/beneficiaries' as any) }]
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Add Beneficiary"
        subtitle="Save account details for fast 1-tap transfers"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Card style={s.card}>
          <CardContent style={s.content}>
            <Text style={s.label}>Recipient Full Legal Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={s.input}
              placeholder="e.g. Mary Wanjiku"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={[s.label, { marginTop: 12 }]}>Bank / Institution Name</Text>
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              style={s.input}
              placeholder="e.g. Equity Bank Kenya"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={[s.label, { marginTop: 12 }]}>IBAN / Account Number</Text>
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              style={s.input}
              placeholder="e.g. 1029384756"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={[s.label, { marginTop: 12 }]}>SWIFT / BIC Code (Optional)</Text>
            <TextInput
              value={swiftCode}
              onChangeText={setSwiftCode}
              style={s.input}
              placeholder="e.g. EQBLKENA"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Button
              title="Save Beneficiary"
              variant="primary"
              size="lg"
              onPress={handleSave}
              style={{ marginTop: 22 }}
            />
          </CardContent>
        </Card>
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
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    content: {
      padding: 16,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 6,
    },
    input: {
      height: 46,
      borderRadius: 10,
      backgroundColor: `${theme.colors.textSecondary}10`,
      paddingHorizontal: 12,
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textPrimary,
    },
  });
}
