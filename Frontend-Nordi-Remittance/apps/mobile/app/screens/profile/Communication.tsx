// ============================================================================
// COMMUNICATION PREFERENCES — Notification channels & marketing settings
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PreferenceSetting {
  id: string;
  label: string;
  desc: string;
  icon: string;
  enabled: boolean;
}

export default function CommunicationScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [prefs, setPrefs] = useState<PreferenceSetting[]>([
    { id: 'push', label: 'Push Notifications', desc: 'Transaction alerts, account updates', icon: 'notifications-outline', enabled: true },
    { id: 'email', label: 'Email Notifications', desc: 'Statements, receipts & reports', icon: 'mail-outline', enabled: true },
    { id: 'sms', label: 'SMS Alerts', desc: 'OTPs and critical security alerts', icon: 'chatbox-outline', enabled: true },
    { id: 'marketing', label: 'Marketing Emails', desc: 'Promotions, news & special offers', icon: 'megaphone-outline', enabled: false },
    { id: 'weekly', label: 'Weekly Digest', desc: 'Summary of your financial activity', icon: 'calendar-outline', enabled: true },
    { id: 'security', label: 'Security Alerts', desc: 'Login attempts, device changes', icon: 'shield-outline', enabled: true },
  ]);

  const toggle = (id: string) => {
    setPrefs((p) => p.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Communication"
        subtitle="Control how Nordi contacts you"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Card style={s.card}>
          <CardContent style={s.cardContent}>
            {prefs.map((item, idx) => (
              <View
                key={item.id}
                style={[s.row, idx < prefs.length - 1 && s.rowBorder]}
              >
                <View style={s.rowIcon}>
                  <Ionicons name={item.icon as any} size={18} color={theme.colors.primary} />
                </View>
                <View style={s.rowText}>
                  <Text style={s.rowLabel}>{item.label}</Text>
                  <Text style={s.rowDesc}>{item.desc}</Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => toggle(item.id)}
                  trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                  thumbColor={item.enabled ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>
            ))}
          </CardContent>
        </Card>

        <Button
          variant="primary"
          onPress={() => {}}
          style={s.saveBtn}
        >
          Save Preferences
        </Button>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    cardContent: { padding: 4 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      gap: 12,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary },
    rowDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    saveBtn: { marginTop: 4 },
  });
}
