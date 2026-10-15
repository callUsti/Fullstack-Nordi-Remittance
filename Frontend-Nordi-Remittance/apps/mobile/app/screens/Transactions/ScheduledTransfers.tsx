// ============================================================================
// SCHEDULED TRANSFERS SCREEN — Recurring Standing Orders & Auto-Payments
// ============================================================================
import React from 'react';
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

export default function ScheduledTransfersScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const schedules = [
    {
      id: 'sc1',
      title: 'Family Remittance Support',
      recipient: 'Mary Wanjiku (Kenya)',
      amount: 300.00,
      frequency: 'Monthly, on 1st',
      nextDate: '01 Nov 2026',
      status: 'active',
    },
    {
      id: 'sc2',
      title: 'Apartment Rent London',
      recipient: 'Canary Wharf Estates',
      amount: 1450.00,
      frequency: 'Monthly, on 28th',
      nextDate: '28 Oct 2026',
      status: 'active',
    },
  ];

  const handleCancel = (title: string) => {
    Alert.alert(
      'Cancel Schedule',
      `Cancel recurring transfer "${title}"?`,
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Cancel Schedule', style: 'destructive', onPress: () => Alert.alert('Cancelled', 'Transfer schedule deleted.') },
      ]
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Scheduled Transfers"
        subtitle="Automated recurring wires and standing orders"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {schedules.map((item) => (
          <Card key={item.id} style={s.card}>
            <CardContent style={s.content}>
              <View style={s.headerRow}>
                <View style={s.iconWrap}>
                  <Ionicons name="repeat" size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.title}>{item.title}</Text>
                  <Text style={s.recipient}>{item.recipient}</Text>
                </View>
                <Badge variant="success" size="sm">Active</Badge>
              </View>

              <View style={s.detailsRow}>
                <View>
                  <Text style={s.metaLabel}>Frequency</Text>
                  <Text style={s.metaVal}>{item.frequency}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.metaLabel}>Transfer Amount</Text>
                  <Text style={s.amount}>${item.amount.toFixed(2)}</Text>
                </View>
              </View>

              <View style={s.footerRow}>
                <Text style={s.nextDate}>Next Run: {item.nextDate}</Text>
                <TouchableOpacity onPress={() => handleCancel(item.title)}>
                  <Text style={s.cancelText}>Cancel Schedule</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        ))}

        <Button
          title="+ Create New Recurring Transfer"
          variant="outline"
          size="md"
          onPress={() => router.push('/screens/send-money' as any)}
          style={{ marginTop: 12 }}
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
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    content: {
      padding: 14,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    recipient: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    metaLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    metaVal: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    amount: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    nextDate: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    cancelText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.error,
    },
  });
}
