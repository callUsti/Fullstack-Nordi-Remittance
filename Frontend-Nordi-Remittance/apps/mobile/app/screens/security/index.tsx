// ============================================================================
// SECURITY HUB — Settings, 2FA, Biometric, Activity Logs, Security Alerts
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { QuerySection } from '@/components/shared/QuerySection';
import { useClientSecuritySettings } from '@nordi/shared/client-usecase';

interface SecurityNavItem {
  icon: string;
  label: string;
  subtitle: string;
  route: string;
  badge?: string;
}

const NAV_ITEMS: SecurityNavItem[] = [
  {
    icon: 'lock-closed-outline',
    label: 'Security Settings',
    subtitle: 'Password, session & privacy controls',
    route: '/screens/security/SecuritySettings',
  },
  {
    icon: 'shield-checkmark-outline',
    label: 'Two-Factor Authentication',
    subtitle: 'Add an extra layer of protection',
    route: '/screens/security/TwoFactorAuth',
  },
  {
    icon: 'finger-print-outline',
    label: 'Biometric Access',
    subtitle: 'Face ID & fingerprint login',
    route: '/screens/security/BiometricAccess',
  },
  {
    icon: 'time-outline',
    label: 'Activity Logs',
    subtitle: 'View login & session history',
    route: '/screens/security/ActivityLogs',
  },
  {
    icon: 'warning-outline',
    label: 'Security Alerts',
    subtitle: 'Suspicious activity & fraud notifications',
    route: '/screens/security/SecurityAlertsList',
    badge: '2',
  },
];

export default function SecurityScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);
  const securityQuery = useClientSecuritySettings();
  const score = (securityQuery as any)?.settings?.securityScore ?? (securityQuery as any)?.data?.securityScore ?? 75;
  const scoreColor = score >= 80 ? theme.colors.success : score >= 50 ? '#f59e0b' : theme.colors.danger;

  return (
    <View style={s.container}>
      <ScreenHeader title="Security Center" subtitle="Protect your Nordi account" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Security Score */}
        <Card style={s.scoreCard}>
          <CardContent style={s.scoreContent}>
            <View style={s.scoreCircle}>
              <Text style={[s.scoreNumber, { color: scoreColor }]}>{score}</Text>
              <Text style={s.scoreLabel}>/ 100</Text>
            </View>
            <View style={s.scoreInfo}>
              <Text style={s.scoreTitle}>Security Score</Text>
              <Text style={s.scoreDesc}>
                {score >= 80
                  ? 'Excellent — your account is well protected.'
                  : score >= 50
                  ? 'Good — consider enabling 2FA for a higher score.'
                  : 'Low — take action to improve your account security.'}
              </Text>
              <Badge
                variant={score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger'}
                size="sm"
                style={s.scoreBadge}
              >
                {score >= 80 ? 'Strong' : score >= 50 ? 'Moderate' : 'Weak'}
              </Badge>
            </View>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card style={s.menuCard}>
          <CardContent style={s.menuContent}>
            {NAV_ITEMS.map((item, idx) => (
              <TouchableOpacity
                key={item.route}
                style={[s.menuItem, idx < NAV_ITEMS.length - 1 && s.menuItemBorder]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={s.menuIcon}>
                  <Ionicons name={item.icon as any} size={20} color={theme.colors.primary} />
                </View>
                <View style={s.menuText}>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Text style={s.menuSub}>{item.subtitle}</Text>
                </View>
                {item.badge && (
                  <Badge variant="danger" size="sm">{item.badge}</Badge>
                )}
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    scoreCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    scoreContent: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
    scoreCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 3,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreNumber: { fontSize: 22, fontWeight: '800' },
    scoreLabel: { fontSize: 10, color: theme.colors.textSecondary },
    scoreInfo: { flex: 1, gap: 4 },
    scoreTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
    scoreDesc: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 17 },
    scoreBadge: { alignSelf: 'flex-start', marginTop: 4 },
    menuCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    menuContent: { padding: 0 },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
    },
    menuItemBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    menuIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuText: { flex: 1 },
    menuLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
    menuSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  });
}
