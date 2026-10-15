// ============================================================================
// APPLY FOR LOAN SCREEN — Credit Line & Installment Loan Application
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
import { useApplyForLoan } from '@nordi/shared/client-usecase';

export default function ApplyForLoanScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [loanType, setLoanType] = useState('personal');
  const [amount, setAmount] = useState('5000');
  const [termMonths, setTermMonths] = useState('12');
  const [purpose, setPurpose] = useState('Business expansion & working capital');

  const applyMutation = useApplyForLoan();

  const handleApply = () => {
    applyMutation.mutate(
      {
        loanType: loanType as any,
        amount: parseFloat(amount) || 0,
        termMonths: parseInt(termMonths, 10) || 12,
        purpose,
      } as any,
      {
        onSuccess: () => {
          Alert.alert(
            'Application Submitted',
            'Your credit assessment has been initiated. Decisions are usually approved within 15 minutes.',
            [{ text: 'View Status', onPress: () => router.replace('/screens/loans' as any) }]
          );
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Could not submit application.');
        },
      }
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Credit Line Application"
        subtitle="Zero collateral requirements • Instant credit scoring"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Card style={s.card}>
          <CardContent style={s.content}>
            <Text style={s.label}>Requested Amount ($ USD)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              style={[s.input, { fontSize: 20, fontWeight: '700' }]}
              keyboardType="numeric"
            />

            <Text style={[s.label, { marginTop: 14 }]}>Duration (Months)</Text>
            <TextInput
              value={termMonths}
              onChangeText={setTermMonths}
              style={s.input}
              keyboardType="numeric"
            />

            <Text style={[s.label, { marginTop: 14 }]}>Loan Purpose</Text>
            <TextInput
              value={purpose}
              onChangeText={setPurpose}
              style={s.input}
            />

            <Button
              title={applyMutation.isPending ? 'Submitting Application...' : 'Submit Application'}
              variant="primary"
              size="lg"
              onPress={handleApply}
              disabled={applyMutation.isPending}
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
      color: theme.colors.textPrimary,
      fontWeight: '500',
    },
  });
}
