// ============================================================================
// CURRENCY ALERTS SCREEN — Target Exchange Rate Notifications
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';

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
    <AdaptiveScreen
      keyboardAvoiding
      header={
        <ScreenHeader
          title="FX Rate Triggers & Alerts"
          subtitle="Get notified when currencies reach your target exchange rate"
          showBack
          onBackPress={() => router.back()}
        />
      }
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
            style={{ marginTop: SPACING.md }}
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
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    createCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: SPACING.xl,
    },
    createContent: {
      padding: SPACING.lg,
    },
    label: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: SPACING.sm,
    },
    input: {
      height: 46,
      borderRadius: RADIUS.sm,
      backgroundColor: `${theme.colors.textSecondary}10`,
      paddingHorizontal: SPACING.md,
      fontSize: FONT_SIZES.title,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: SPACING.sm,
    },
    alertCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: SPACING.sm,
    },
    alertContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.md,
    },
    pairName: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    targetVal: {
      fontSize: FONT_SIZES.bodySm,
      color: theme.colors.textSecondary,
      marginTop: SPACING.xxs,
    },
  });
}
