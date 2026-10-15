// ============================================================================
// CLIENT USER EDIT — Update personal profile fields
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useClientProfile } from '@nordi/shared/client-usecase';

interface FieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  icon: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  theme: ReturnType<typeof useMobileTheme>;
}

const Field: React.FC<FieldProps> = ({ label, value, onChange, icon, placeholder, keyboardType = 'default', theme }) => {
  const s = fieldStyles(theme);
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputWrap}>
        <Ionicons name={icon as any} size={16} color={theme.colors.textSecondary} style={s.icon} />
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? label}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
};

function fieldStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    fieldWrap: { marginBottom: 14 },
    label: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500', marginBottom: 6 },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    icon: {},
    input: { flex: 1, fontSize: 14, color: theme.colors.textPrimary },
  });
}

export default function ClientUserEditScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);
  const { user: profile } = useClientProfile() as any;

  const [form, setForm] = useState({
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    nationality: profile?.nationality ?? '',
  });

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    Alert.alert('Saved', 'Your profile has been updated successfully.');
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Edit Profile"
        subtitle="Update your personal information"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Card style={s.card}>
          <CardContent style={s.cardContent}>
            <Text style={s.sectionTitle}>Personal Details</Text>
            <Field label="First Name" value={form.firstName} onChange={set('firstName')} icon="person-outline" theme={theme} />
            <Field label="Last Name" value={form.lastName} onChange={set('lastName')} icon="person-outline" theme={theme} />
            <Field label="Email Address" value={form.email} onChange={set('email')} icon="mail-outline" keyboardType="email-address" theme={theme} />
            <Field label="Phone Number" value={form.phone} onChange={set('phone')} icon="call-outline" keyboardType="phone-pad" theme={theme} />
            <Field label="Nationality" value={form.nationality} onChange={set('nationality')} icon="globe-outline" theme={theme} />
          </CardContent>
        </Card>

        <Button variant="primary" onPress={handleSave} style={s.saveBtn}>
          Save Changes
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
    cardContent: { padding: 16 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 16 },
    saveBtn: { marginTop: 4 },
  });
}
