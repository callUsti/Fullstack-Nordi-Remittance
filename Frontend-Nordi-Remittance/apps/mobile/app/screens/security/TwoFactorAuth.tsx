// ============================================================================
// TWO-FACTOR AUTHENTICATION — Enable/disable & manage 2FA methods
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
import { Button } from '@/components/ui/Button';
import { useSecurityStore } from '@/stores';

interface TFAMethod {
  id: string;
  icon: string;
  label: string;
  desc: string;
  enabled: boolean;
  recommended?: boolean;
}

export default function TwoFactorAuthScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const { tfaMethods, toggleTfaMethod } = useSecurityStore();
  const methods = tfaMethods;
  const toggle = (id: string) => toggleTfaMethod(id);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Two-Factor Auth"
        subtitle="Manage your 2FA security methods"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Card style={s.infoCard}>
          <CardContent style={s.infoContent}>
            <Ionicons name="shield-checkmark" size={22} color={theme.colors.primary} />
            <Text style={s.infoText}>
              Two-factor authentication adds an extra security layer. Enable at least one method to protect your account.
            </Text>
          </CardContent>
        </Card>

        {methods.map((method) => (
          <Card key={method.id} style={s.card}>
            <CardContent style={s.cardContent}>
              <View style={s.methodIcon}>
                <Ionicons name={method.icon as any} size={22} color={theme.colors.primary} />
              </View>
              <View style={s.methodInfo}>
                <View style={s.methodHeader}>
                  <Text style={s.methodLabel}>{method.label}</Text>
                  {method.recommended && (
                    <Badge variant="primary" size="sm">Recommended</Badge>
                  )}
                </View>
                <Text style={s.methodDesc}>{method.desc}</Text>
              </View>
              <TouchableOpacity
                style={[s.toggleBtn, method.enabled && s.toggleBtnActive]}
                onPress={() => toggle(method.id)}
                activeOpacity={0.8}
              >
                <Text style={[s.toggleText, method.enabled && s.toggleTextActive]}>
                  {method.enabled ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>
            </CardContent>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    infoCard: {
      backgroundColor: `${theme.colors.primary}10`,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
      marginBottom: 16,
    },
    infoContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
    infoText: { flex: 1, fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    methodIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodInfo: { flex: 1 },
    methodHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    methodLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary },
    methodDesc: { fontSize: 11, color: theme.colors.textSecondary },
    toggleBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    toggleBtnActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}15` },
    toggleText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
    toggleTextActive: { color: theme.colors.primary },
  });
}
