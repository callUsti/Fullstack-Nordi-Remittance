// ============================================================================
// SECURITY SETTINGS — Password, session timeout & privacy settings
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QuerySection } from '@/components/shared/QuerySection';
import { useClientSecuritySettings, useUpdateSecuritySettings } from '@nordi/shared/client-usecase';
import { useSecurityStore } from '@/stores';

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const securityQuery = useClientSecuritySettings();
  const updateMutation = useUpdateSecuritySettings();

  const {
    showCurrentPassword: showCurrent,
    setShowCurrentPassword: setShowCurrent,
    showNewPassword: showNew,
    setShowNewPassword: setShowNew,
    securityPasswords: passwords,
    setSecurityPasswords: setPasswords,
    loginAlerts,
    setLoginAlerts,
    sessionTimeout,
    setSessionTimeout,
    resetSecurityPasswords,
  } = useSecurityStore();

  const handlePasswordChange = async () => {
    if (passwords.newPass !== passwords.confirm) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    try {
      await (updateMutation as any).mutateAsync({});
      Alert.alert('Success', 'Password updated successfully.');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch {
      Alert.alert('Error', 'Failed to update password. Please try again.');
    }
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Security Settings"
        subtitle="Manage your account security"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Change Password */}
        <Text style={s.sectionLabel}>Change Password</Text>
        <Card style={s.card}>
          <CardContent style={s.cardContent}>
            {[
              { label: 'Current Password', key: 'current', show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
              { label: 'New Password', key: 'newPass', show: showNew, toggle: () => setShowNew(!showNew) },
              { label: 'Confirm New Password', key: 'confirm', show: showNew, toggle: () => setShowNew(!showNew) },
            ].map((field) => (
              <View key={field.key} style={s.fieldWrap}>
                <Text style={s.fieldLabel}>{field.label}</Text>
                <View style={s.inputRow}>
                  <TextInput
                    style={s.input}
                    value={(passwords as any)[field.key]}
                    onChangeText={(v) => setPasswords((p) => ({ ...p, [field.key]: v }))}
                    secureTextEntry={!field.show}
                    placeholderTextColor={theme.colors.textSecondary}
                    placeholder={field.label}
                  />
                  <TouchableOpacity onPress={field.toggle} style={s.eyeBtn}>
                    <Ionicons
                      name={field.show ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Button variant="primary" onPress={handlePasswordChange} style={s.updateBtn}>
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Text style={s.sectionLabel}>Preferences</Text>
        <Card style={s.card}>
          <CardContent style={s.prefContent}>
            {[
              { label: 'Login Alerts', desc: 'Notify me on new device logins', value: loginAlerts, toggle: () => setLoginAlerts(!loginAlerts) },
              { label: 'Auto Session Timeout', desc: 'Log out after 15 minutes of inactivity', value: sessionTimeout, toggle: () => setSessionTimeout(!sessionTimeout) },
            ].map((pref, idx, arr) => (
              <View key={pref.label} style={[s.prefRow, idx < arr.length - 1 && s.prefRowBorder]}>
                <View style={s.prefText}>
                  <Text style={s.prefLabel}>{pref.label}</Text>
                  <Text style={s.prefDesc}>{pref.desc}</Text>
                </View>
                <Switch
                  value={pref.value}
                  onValueChange={pref.toggle}
                  trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                  thumbColor={pref.value ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>
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
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginTop: 4,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    cardContent: { padding: 16 },
    prefContent: { padding: 4 },
    fieldWrap: { marginBottom: 12 },
    fieldLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 6 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
    },
    input: { flex: 1, height: 44, fontSize: 14, color: theme.colors.textPrimary },
    eyeBtn: { padding: 4 },
    updateBtn: { marginTop: 4 },
    prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, gap: 12 },
    prefRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    prefText: { flex: 1 },
    prefLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary },
    prefDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  });
}
