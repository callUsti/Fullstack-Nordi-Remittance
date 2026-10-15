// ============================================================================
// AUTOPAY SETUP SCREEN — Direct Debit & Recurring Bill Approvals
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function AutopaySetupScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [autopayItems, setAutopayItems] = useState([
    { id: '1', title: 'Starlink Internet', maxCap: 120, nextDate: '24 Oct 2026', enabled: true },
    { id: '2', title: 'British Gas Energy', maxCap: 85, nextDate: '28 Oct 2026', enabled: true },
    { id: '3', title: 'Council Tax Direct Debit', maxCap: 190, nextDate: '01 Nov 2026', enabled: false },
  ]);

  const toggleSwitch = (id: string) => {
    setAutopayItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Autopay & Direct Debits"
        subtitle="Automatic recurring settlements with custom safety caps"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Card style={s.infoCard}>
          <CardContent style={s.infoContent}>
            <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
            <Text style={s.infoText}>
              Nordi Autopay guarantees payments are only executed if within your pre-approved ceiling.
            </Text>
          </CardContent>
        </Card>

        <Text style={s.sectionTitle}>Active Autopay Authorizations</Text>

        {autopayItems.map((item) => (
          <Card key={item.id} style={s.card}>
            <CardContent style={s.content}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={s.title}>{item.title}</Text>
                  <Badge variant={item.enabled ? 'success' : 'neutral'} size="sm" style={{ marginLeft: 8 }}>
                    {item.enabled ? 'Active' : 'Paused'}
                  </Badge>
                </View>
                <Text style={s.meta}>Safety Cap: ${item.maxCap} • Next: {item.nextDate}</Text>
              </View>

              <Switch
                value={item.enabled}
                onValueChange={() => toggleSwitch(item.id)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </CardContent>
          </Card>
        ))}

        <Button
          title="+ Authorize New Biller"
          variant="outline"
          size="md"
          onPress={() => router.push('/screens/bills' as any)}
          style={{ marginTop: 14 }}
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
    infoCard: {
      backgroundColor: `${theme.colors.success}10`,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${theme.colors.success}30`,
      marginBottom: 16,
    },
    infoContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.textPrimary,
      marginLeft: 10,
      lineHeight: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 10,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    meta: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 3,
    },
  });
}
