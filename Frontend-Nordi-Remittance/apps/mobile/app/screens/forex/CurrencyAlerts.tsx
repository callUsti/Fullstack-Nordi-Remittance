// ============================================================================
// CURRENCY ALERTS SCREEN — Target Exchange Rate Notifications
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
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

export default function CurrencyAlertsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [targetRate, setTargetRate] = useState('1.1000');
  const [alerts, setAlerts] = useState([
    { id: '1', pair: 'EUR / USD', target: '1.1000', active: true },
    { id: '2', pair: 'USD / NGN', target: '1,700.00', active: true },
  ]);

  const handleAddAlert = () => {
    Alert.alert('Alert Created', `You will receive push and email alerts when EUR/USD hits ${targetRate}.`);
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="FX Rate Triggers & Alerts"
        subtitle="Get notified when currencies reach your target exchange rate"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Card style={s.createCard}>
          <CardContent style={s.createContent}>
            <Text style={s.label}>Notify me when EUR/USD reaches:</Text>
            <TextInput
              value={targetRate}
              onChangeText={setTargetRate}
              style={s.input}
              keyboardType="decimal-pad"
            />
            <Button
              title="+ Set Rate Trigger"
              variant="primary"
              size="md"
              onPress={handleAddAlert}
              style={{ marginTop: 12 }}
            />
          </CardContent>
        </Card>

        <Text style={s.sectionTitle}>Active Watchlist Alerts</Text>

        {alerts.map((al) => (
          <Card key={al.id} style={s.alertCard}>
            <CardContent style={s.alertContent}>
              <View style={{ flex: 1 }}>
                <Text style={s.pairName}>{al.pair}</Text>
                <Text style={s.targetVal}>Target: {al.target}</Text>
              </View>
              <Badge variant="success" size="sm">Active Alert</Badge>
            </CardContent>
          </Card>
        ))}
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
    createCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    createContent: {
      padding: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    input: {
      height: 46,
      borderRadius: 10,
      backgroundColor: `${theme.colors.textSecondary}10`,
      paddingHorizontal: 12,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 10,
    },
    alertCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    alertContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
    },
    pairName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    targetVal: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });
}
