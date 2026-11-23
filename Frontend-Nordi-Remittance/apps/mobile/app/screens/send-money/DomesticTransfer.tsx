// ============================================================================
// DOMESTIC TRANSFER SCREEN — Local routing, Faster Payments, Fedwire, NIBSS
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTransfer } from '@nordi/shared/client-usecase';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useSendMoneyStore } from '@/stores';

export default function DomesticTransferScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const {
    domestic: { accountNumber, bankName, amount, narration: reference },
    setDomesticAccount: setAccountNumber,
    setDomesticBank: setSortCode,
    setDomesticAmount: setAmount,
    setDomesticNarration: setReference,
    resetDomestic,
  } = useSendMoneyStore();

  // recipientName is local — it's looked up from account number
  const [recipientName, setRecipientName] = React.useState('');

  const transferMutation = useTransfer();

  const handleSend = () => {
    if (!recipientName || !accountNumber) {
      Alert.alert('Required Fields', 'Please enter recipient name and account number.');
      return;
    }

    transferMutation.mutate(
      {
        recipientName,
        accountNumber,
        routingNumber: bankName,
        amount: parseFloat(amount) || 0,
        currency: 'USD',
        description: reference || 'Domestic transfer',
      } as any,
      {
        onSuccess: () => {
          Alert.alert(
            'Transfer Submitted',
            `$${amount} is on its way to ${recipientName}. Settlement is expected within minutes.`,
            [{ text: 'Done', onPress: () => router.replace('/screens/transactions' as any) }]
          );
        },
        onError: (err: any) => {
          Alert.alert('Transfer Error', err?.message || 'Could not complete transfer.');
        },
      }
    );
  };

  return (
    <AdaptiveScreen
      withTabBar={false}
      header={
        <ScreenHeader
          title="Domestic Bank Transfer"
          subtitle="Zero fee instant local clearing"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
      <Card style={s.formCard}>
          <CardContent style={s.formContent}>
            <Text style={s.label}>Recipient Full Name</Text>
            <TextInput
              value={recipientName}
              onChangeText={setRecipientName}
              style={s.input}
              placeholder="e.g. David Miller"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={[s.label, { marginTop: 12 }]}>Account Number / IBAN</Text>
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              style={s.input}
              placeholder="e.g. 1029384756"
              keyboardType="number-pad"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={[s.label, { marginTop: 12 }]}>Sort Code / Routing Number</Text>
            <TextInput
              value={bankName}
              onChangeText={setSortCode}
              style={s.input}
              placeholder="e.g. 04-00-04"
              keyboardType="number-pad"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={[s.label, { marginTop: 12 }]}>Amount ($ USD)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              style={[s.input, { fontSize: 20, fontWeight: '700' }]}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={[s.label, { marginTop: 12 }]}>Payment Reference / Note</Text>
            <TextInput
              value={reference}
              onChangeText={setReference}
              style={s.input}
              placeholder="e.g. Invoice #204"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Button
              title={transferMutation.isPending ? 'Sending...' : 'Confirm Domestic Transfer'}
              variant="primary"
              size="lg"
              onPress={handleSend}
              disabled={transferMutation.isPending}
              style={{ marginTop: 20 }}
            />
          </CardContent>
        </Card>
    </AdaptiveScreen>
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
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    formContent: {
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
      color: theme.colors.textPrimary,
      fontWeight: '500',
    },
  });
}
