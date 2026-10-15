// ============================================================================
// QUICK TRANSFER SCREEN — Send by Phone / Email / Quick Contact
// Connected to shared useTransferToUser and useClientRecentRecipients
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useTransferToUser, useClientRecentRecipients } from '@nordi/shared/client-usecase';
import { useSendMoneyStore } from '@/stores';

export default function QuickTransferScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const {
    quick: { selectedContactId: identifier, amount, note },
    setQuickContact: setIdentifier,
    setQuickAmount: setAmount,
    setQuickNote: setNote,
    resetQuick,
  } = useSendMoneyStore();

  const { recipients } = useClientRecentRecipients();
  const transferUserMutation = useTransferToUser();

  const handleSend = () => {
    if (!identifier) {
      Alert.alert('Required', 'Please enter a mobile phone, email, or @nordi tag.');
      return;
    }

    transferUserMutation.mutate(
      {
        recipient: identifier,
        amount: parseFloat(amount) || 0,
        currency: 'USD',
        note,
      } as any,
      {
        onSuccess: () => {
          Alert.alert(
            'Transfer Sent!',
            `$${amount} was transferred immediately to ${identifier}.`,
            [{ text: 'Done', onPress: () => router.replace('/screens/transactions' as any) }]
          );
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Could not complete transfer.');
        },
      }
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Quick Transfer"
        subtitle="Send instantly by mobile phone or email"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Text style={s.sectionTitle}>Recent Recipients</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.recipientsTrack}
        >
          {(recipients?.length ? recipients : [
            { id: '1', name: 'Alice Smith', tag: '@alice' },
            { id: '2', name: 'Bob Jones', tag: '@bobj' },
            { id: '3', name: 'Elena Rostova', tag: '@elena_r' },
            { id: '4', name: 'Kwame Mensah', tag: '@kwame' },
          ]).map((r: any) => (
            <TouchableOpacity
              key={r.id}
              style={s.recipientItem}
              onPress={() => setIdentifier(r.tag || r.name)}
            >
              <Avatar name={r.name} size="md" />
              <Text style={s.recipientName} numberOfLines={1}>{r.name.split(' ')[0]}</Text>
              <Text style={s.recipientTag}>{r.tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Card style={s.formCard}>
          <CardContent style={s.formContent}>
            <Text style={s.label}>Recipient Mobile, Email or @Tag</Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              style={s.input}
              placeholder="e.g. +1 555-0199 or @sarah"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={[s.label, { marginTop: 14 }]}>Amount ($ USD)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              style={[s.input, { fontSize: 22, fontWeight: '700' }]}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={[s.label, { marginTop: 14 }]}>Optional Memo</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              style={s.input}
              placeholder="Dinner split, gifts, etc."
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Button
              title={transferUserMutation.isPending ? 'Sending...' : 'Send Now'}
              variant="primary"
              size="lg"
              onPress={handleSend}
              disabled={transferUserMutation.isPending}
              style={{ marginTop: 20 }}
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
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 10,
    },
    recipientsTrack: {
      marginBottom: 16,
    },
    recipientItem: {
      alignItems: 'center',
      marginRight: 16,
      width: 64,
    },
    recipientName: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginTop: 4,
    },
    recipientTag: {
      fontSize: 10,
      color: theme.colors.textSecondary,
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
