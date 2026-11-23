// ============================================================================
// AUTO-SAVE RULES — Configure automated savings rules and triggers
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { Icon } from '@/components/ui/Icon';
import { ICON_SIZES, SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';

interface AutoSaveRule {
  id: string;
  iconName: string;
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
    { id: 'round', iconName: 'ArrowUpCircle', label: 'Round-Up Savings', desc: 'Round up every purchase and save the difference', enabled: true, trigger: 'Per transaction' },
    { id: 'weekly', iconName: 'Calendar', label: 'Weekly Auto-Save', desc: 'Automatically save a fixed amount every Monday', enabled: true, amount: '$50', trigger: 'Every Monday' },
    { id: 'salary', iconName: 'Banknote', label: 'Salary Auto-Save', desc: 'Save a percentage of every incoming salary', enabled: false, amount: '10%', trigger: 'On salary credit' },
    { id: 'spending', iconName: 'TrendingDown', label: 'Spend Less Save More', desc: 'If you spend less than $200 this week, save $50', enabled: false, trigger: 'Weekly' },
  ]);

  const toggle = (id: string) => {
    setRules((r) => r.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule));
  };

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <AdaptiveScreen
      header={
        <ScreenHeader
          title="Auto-Save Rules"
          subtitle="Automate your savings effortlessly"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
      <Card style={s.statusCard}>
        <CardContent style={s.statusContent}>
          <Icon name="RefreshCw" size={ICON_SIZES.lg} color={theme.colors.primary} />
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
              <Icon name={rule.iconName as any} size={ICON_SIZES.base} color={theme.colors.primary} />
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
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    statusCard: {
      backgroundColor: `${theme.colors.primary}10`,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
      marginBottom: SPACING.lg,
    },
    statusContent: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
    statusText: { flex: 1 },
    statusTitle: { fontSize: FONT_SIZES.subhead, fontWeight: '700', color: theme.colors.textPrimary },
    statusDesc: { fontSize: FONT_SIZES.caption, color: theme.colors.textSecondary, marginTop: SPACING.xxs },
    ruleCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: SPACING.sm,
    },
    ruleContent: { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.md, gap: SPACING.md },
    ruleIcon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.sm,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ruleInfo: { flex: 1 },
    ruleHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
    ruleLabel: { flex: 1, fontSize: FONT_SIZES.body, fontWeight: '700', color: theme.colors.textPrimary },
    ruleDesc: { fontSize: FONT_SIZES.caption, color: theme.colors.textSecondary, lineHeight: 16 },
    ruleTrigger: { fontSize: FONT_SIZES.micro, color: theme.colors.textSecondary, marginTop: SPACING.xs },
    addBtn: { marginTop: SPACING.xs },
  });
}
