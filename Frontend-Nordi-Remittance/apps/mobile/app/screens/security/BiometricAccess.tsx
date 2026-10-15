// ============================================================================
// BIOMETRIC ACCESS — Fingerprint & Face ID login management
// ============================================================================
import React from 'react';
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
import { useSecurityStore } from '@/stores';

export default function BiometricAccessScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const {
    fingerprintLogin, setFingerprintLogin,
    faceIdLogin, setFaceIdLogin,
    biometricTransactions, setBiometricTransactions,
    biometricCardView, setBiometricCardView,
  } = useSecurityStore();

  const handleEnrollBiometric = () => {
    Alert.alert(
      'Enroll Biometric',
      'This will use your device biometric authentication. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => Alert.alert('Success', 'Biometric enrolled successfully.') },
      ]
    );
  };

  const rows = [
    { label: 'Fingerprint Login', desc: 'Use fingerprint to sign in', value: fingerprintLogin, toggle: () => setFingerprintLogin(!fingerprintLogin), icon: 'finger-print-outline' },
    { label: 'Face ID Login', desc: 'Use Face ID to sign in', value: faceIdLogin, toggle: () => setFaceIdLogin(!faceIdLogin), icon: 'scan-outline' },
    { label: 'Transaction Approval', desc: 'Require biometric to approve payments', value: biometricTransactions, toggle: () => setBiometricTransactions(!biometricTransactions), icon: 'cash-outline' },
    { label: 'Card Details View', desc: 'Require biometric to view card numbers', value: biometricCardView, toggle: () => setBiometricCardView(!biometricCardView), icon: 'card-outline' },
  ];

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Biometric Access"
        subtitle="Manage fingerprint & Face ID settings"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Card style={s.heroCard}>
          <CardContent style={s.heroContent}>
            <View style={s.heroIcon}>
              <Ionicons name="finger-print" size={40} color={theme.colors.primary} />
            </View>
            <Text style={s.heroTitle}>Biometric Security</Text>
            <Text style={s.heroDesc}>
              Use your fingerprint or Face ID for quick and secure access to your account.
            </Text>
          </CardContent>
        </Card>

        <Card style={s.card}>
          <CardContent style={s.cardContent}>
            {rows.map((row, idx) => (
              <View key={row.label} style={[s.row, idx < rows.length - 1 && s.rowBorder]}>
                <View style={s.rowIcon}>
                  <Ionicons name={row.icon as any} size={18} color={theme.colors.primary} />
                </View>
                <View style={s.rowText}>
                  <Text style={s.rowLabel}>{row.label}</Text>
                  <Text style={s.rowDesc}>{row.desc}</Text>
                </View>
                <Switch
                  value={row.value}
                  onValueChange={row.toggle}
                  trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                  thumbColor={row.value ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>
            ))}
          </CardContent>
        </Card>

        <Button variant="outline" onPress={handleEnrollBiometric} style={s.enrollBtn}>
          Re-enroll Biometric
        </Button>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    heroCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    heroContent: { alignItems: 'center', padding: 24, gap: 8 },
    heroIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    heroTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
    heroDesc: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18 },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    cardContent: { padding: 4 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, gap: 12 },
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
    enrollBtn: { marginTop: 4 },
  });
}
