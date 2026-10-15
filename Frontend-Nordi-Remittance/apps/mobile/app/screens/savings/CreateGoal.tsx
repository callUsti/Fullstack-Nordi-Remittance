// ============================================================================
// CREATE GOAL — Set up a new savings goal with target & deadline
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

const ICONS = ['🎯', '🏠', '✈️', '🚗', '💍', '🎓', '💻', '🛡️', '⚕️', '🎮'];

export default function CreateGoalScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    initialDeposit: '',
    deadline: '',
    icon: '🎯',
  });

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleCreate = () => {
    if (!form.name || !form.targetAmount) {
      Alert.alert('Error', 'Please fill in the goal name and target amount.');
      return;
    }
    Alert.alert('Goal Created!', `Your savings goal "${form.name}" has been created.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Create Savings Goal"
        subtitle="Set your target and start saving"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Icon Picker */}
        <Text style={s.sectionLabel}>Choose an Icon</Text>
        <Card style={s.iconCard}>
          <CardContent style={s.iconGrid}>
            {ICONS.map((icon) => (
              <Button
                key={icon}
                variant={form.icon === icon ? 'primary' : 'ghost'}
                onPress={() => setForm((f) => ({ ...f, icon }))}
                style={s.iconBtn}
              >
                <Text style={s.iconEmoji}>{icon}</Text>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Form Fields */}
        <Card style={s.formCard}>
          <CardContent style={s.formContent}>
            {[
              { label: 'Goal Name', key: 'name', placeholder: 'e.g. Emergency Fund', keyboard: 'default' },
              { label: 'Target Amount ($)', key: 'targetAmount', placeholder: 'e.g. 10000', keyboard: 'numeric' },
              { label: 'Initial Deposit ($)', key: 'initialDeposit', placeholder: 'e.g. 500 (optional)', keyboard: 'numeric' },
              { label: 'Target Deadline', key: 'deadline', placeholder: 'e.g. Dec 2027', keyboard: 'default' },
            ].map((field) => (
              <View key={field.key} style={s.fieldWrap}>
                <Text style={s.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={s.input}
                  value={(form as any)[field.key]}
                  onChangeText={set(field.key as keyof typeof form)}
                  placeholder={field.placeholder}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType={field.keyboard as any}
                />
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Preview */}
        {form.name && form.targetAmount && (
          <Card style={s.previewCard}>
            <CardContent style={s.previewContent}>
              <Text style={s.previewEmoji}>{form.icon}</Text>
              <View>
                <Text style={s.previewName}>{form.name}</Text>
                <Text style={s.previewAmount}>Target: ${Number(form.targetAmount || 0).toLocaleString()}</Text>
              </View>
            </CardContent>
          </Card>
        )}

        <Button variant="primary" onPress={handleCreate} style={s.createBtn}>
          Create Goal
        </Button>
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
    iconCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 8 },
    iconBtn: { width: 44, height: 44, borderRadius: 10, padding: 0 },
    iconEmoji: { fontSize: 22 },
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    formContent: { padding: 16, gap: 14 },
    fieldWrap: {},
    fieldLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500', marginBottom: 6 },
    input: {
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    previewCard: {
      backgroundColor: `${theme.colors.primary}10`,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
      marginBottom: 16,
    },
    previewContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    previewEmoji: { fontSize: 28 },
    previewName: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
    previewAmount: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    createBtn: {},
  });
}
