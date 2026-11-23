// ============================================================================
// CREATE GOAL — Set up a new savings goal with target & deadline
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
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';

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
    <AdaptiveScreen
      keyboardAvoiding
      header={
        <ScreenHeader
          title="Create Savings Goal"
          subtitle="Set your target and start saving"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
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

      <Button variant="primary" onPress={handleCreate}>
        Create Goal
      </Button>
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    sectionLabel: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: SPACING.sm,
    },
    iconCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: SPACING.lg,
    },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.sm, gap: SPACING.sm },
    iconBtn: { width: 44, height: 44, borderRadius: RADIUS.sm, padding: 0 },
    iconEmoji: { fontSize: 22 },
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: SPACING.lg,
    },
    formContent: { padding: SPACING.lg, gap: SPACING.md },
    fieldWrap: {},
    fieldLabel: { fontSize: FONT_SIZES.bodySm, color: theme.colors.textSecondary, fontWeight: '500', marginBottom: SPACING.xs },
    input: {
      backgroundColor: theme.colors.background,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 3,
      fontSize: FONT_SIZES.subhead,
      color: theme.colors.textPrimary,
    },
    previewCard: {
      backgroundColor: `${theme.colors.primary}10`,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
      marginBottom: SPACING.lg,
    },
    previewContent: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
    previewEmoji: { fontSize: 28 },
    previewName: { fontSize: FONT_SIZES.subhead, fontWeight: '700', color: theme.colors.textPrimary },
    previewAmount: { fontSize: FONT_SIZES.bodySm, color: theme.colors.textSecondary, marginTop: SPACING.xxs },
  });
}
