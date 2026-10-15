// ============================================================================
// SECURITY ALERTS — Suspicious activity & fraud notification history
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
import { Badge } from '@/components/ui/Badge';

interface SecurityAlert {
  id: string;
  title: string;
  desc: string;
  severity: 'high' | 'medium' | 'low';
  time: string;
  resolved: boolean;
  icon: string;
}

const ALERTS: SecurityAlert[] = [
  {
    id: '1',
    title: 'New Device Login',
    desc: 'A login was detected from a new device in London, UK.',
    severity: 'medium',
    time: '3 days ago',
    resolved: false,
    icon: 'phone-portrait-outline',
  },
  {
    id: '2',
    title: 'Failed Login Attempt',
    desc: 'Multiple failed login attempts were detected from an unknown IP.',
    severity: 'high',
    time: '5 days ago',
    resolved: false,
    icon: 'warning-outline',
  },
  {
    id: '3',
    title: 'Password Changed',
    desc: 'Your account password was successfully changed.',
    severity: 'low',
    time: '2 weeks ago',
    resolved: true,
    icon: 'lock-closed-outline',
  },
  {
    id: '4',
    title: 'Unusual Transaction',
    desc: 'A large transaction of $5,000 was flagged for review.',
    severity: 'high',
    time: '3 weeks ago',
    resolved: true,
    icon: 'alert-circle-outline',
  },
];

const severityVariant: Record<string, 'danger' | 'warning' | 'secondary'> = {
  high: 'danger',
  medium: 'warning',
  low: 'secondary',
};

export default function SecurityAlertsListScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const handleResolve = (id: string) => {
    Alert.alert('Mark Resolved', 'Mark this alert as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resolve', onPress: () => {} },
    ]);
  };

  const active = ALERTS.filter((a) => !a.resolved);
  const resolved = ALERTS.filter((a) => a.resolved);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Security Alerts"
        subtitle="Review suspicious activity on your account"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {active.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Active Alerts ({active.length})</Text>
            {active.map((alert) => (
              <Card key={alert.id} style={s.card}>
                <CardContent style={s.cardContent}>
                  <View style={[s.alertIcon, alert.severity === 'high' && s.highIcon]}>
                    <Ionicons name={alert.icon as any} size={20} color={alert.severity === 'high' ? theme.colors.danger : '#f59e0b'} />
                  </View>
                  <View style={s.alertInfo}>
                    <View style={s.alertHeader}>
                      <Text style={s.alertTitle}>{alert.title}</Text>
                      <Badge variant={severityVariant[alert.severity]} size="sm">
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </View>
                    <Text style={s.alertDesc}>{alert.desc}</Text>
                    <Text style={s.alertTime}>{alert.time}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleResolve(alert.id)} style={s.resolveBtn}>
                    <Ionicons name="checkmark-circle-outline" size={22} color={theme.colors.success} />
                  </TouchableOpacity>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {resolved.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { marginTop: 8 }]}>Resolved Alerts</Text>
            {resolved.map((alert) => (
              <Card key={alert.id} style={[s.card, s.resolvedCard]}>
                <CardContent style={s.cardContent}>
                  <View style={s.resolvedIcon}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  </View>
                  <View style={s.alertInfo}>
                    <Text style={[s.alertTitle, s.resolvedTitle]}>{alert.title}</Text>
                    <Text style={s.alertDesc}>{alert.desc}</Text>
                    <Text style={s.alertTime}>{alert.time}</Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    resolvedCard: { opacity: 0.7 },
    cardContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
    alertIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: '#fef3c715',
      alignItems: 'center',
      justifyContent: 'center',
    },
    highIcon: { backgroundColor: `${theme.colors.danger}15` },
    resolvedIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: `${theme.colors.success}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    alertInfo: { flex: 1, gap: 4 },
    alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    alertTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary },
    resolvedTitle: { color: theme.colors.textSecondary },
    alertDesc: { fontSize: 11, color: theme.colors.textSecondary, lineHeight: 16 },
    alertTime: { fontSize: 10, color: theme.colors.textSecondary },
    resolveBtn: { padding: 4 },
  });
}
