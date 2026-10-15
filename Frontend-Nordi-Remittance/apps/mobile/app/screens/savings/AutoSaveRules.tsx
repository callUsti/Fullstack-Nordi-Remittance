// ============================================================================
// AUTO-SAVE RULES — Configure automated savings rules and triggers
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
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

interface AutoSaveRule {
  id: string;
  icon: string;
  label: string;
  desc: string;
  enabled: boolean;
  amount?: string;
  trigger?: string;
}

export default function AutoSaveRulesScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [rules, setRules] = useState<AutoSaveRule[]>([
    { id: 'round', icon: 'arrow-up-circle-outline', label: 'Round-Up Savings', desc: 'Round up every purchase and save the difference', enabled: true, trigger: 'Per transaction' },
    { id: 'weekly', icon: 'calendar-outline', label: 'Weekly Auto-Save', desc: 'Automatically save a fixed amount every Monday', enabled: true, amount: '$50', trigger: 'Every Monday' },
    { id: 'salary', icon: 'cash-outline', label: 'Salary Auto-Save', desc: 'Save a percentage of every incoming salary', enabled: false, amount: '10%', trigger: 'On salary credit' },
    { id: 'spending', icon: 'trending-down-outline', label: 'Spend Less Save More', desc: 'If you spend less than $200 this week, save $50', enabled: false, trigger: 'Weekly' },
  ]);

  const toggle = (id: string) => {
    setRules((r) => r.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule));
  };

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Auto-Save Rules"
        subtitle="Automate your savings effortlessly"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Card style={s.statusCard}>
          <CardContent style={s.statusContent}>
            <Ionicons name="repeat-outline" size={22} color={theme.colors.primary} />
            <View style={s.statusText}>
              <Text style={s.statusTitle}>{activeCount} Auto-Save Rule{activeCount !== 1 ? 's' : ''} Active</Text>
              <Text style={s.statusDesc}>Automated savings are running in the background.</Text>
            </View>
          </CardContent>
        </Card>

        {rules.map((rule) => (
          <Card key={rule.id} style={s.ruleCard}>
            <CardContent style={s.ruleContent}>
              <View style={s.ruleIcon}>
                <Ionicons name={rule.icon as any} size={20} color={theme.colors.primary} />
              </View>
              <View style={s.ruleInfo}>
                <View style={s.ruleHeader}>
                  <Text style={s.ruleLabel}>{rule.label}</Text>
                  {rule.amount && <Badge variant="secondary" size="sm">{rule.amount}</Badge>}
                </View>
                <Text style={s.ruleDesc}>{rule.desc}</Text>
                {rule.trigger && (
                  <Text style={s.ruleTrigger}>🔔 {rule.trigger}</Text>
                )}
              </View>
              <Switch
                value={rule.enabled}
                onValueChange={() => toggle(rule.id)}
                trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                thumbColor={rule.enabled ? theme.colors.primary : theme.colors.textSecondary}
              />
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onPress={() => Alert.alert('Coming Soon', 'Custom rule builder coming soon!')} style={s.addBtn}>
          + Add Custom Rule
        </Button>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    statusCard: {
      backgroundColor: `${theme.colors.primary}10`,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
      marginBottom: 16,
    },
    statusContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    statusText: { flex: 1 },
    statusTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
    statusDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    ruleCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    ruleContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
    ruleIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ruleInfo: { flex: 1 },
    ruleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    ruleLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },
    ruleDesc: { fontSize: 11, color: theme.colors.textSecondary, lineHeight: 16 },
    ruleTrigger: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 4 },
    addBtn: { marginTop: 4 },
  });
}
