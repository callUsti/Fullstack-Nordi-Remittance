// ============================================================================
// CREDIT SCORE SCREEN — Credit Bureau Breakdown & Factors
// Connected to shared useClientEligibility
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { Icon } from '@/components/ui/Icon';
import { ICON_SIZES, SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';
import { useClientEligibility } from '@nordi/shared/client-usecase';

export default function CreditScoreScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const { eligibility } = useClientEligibility();
  const score = eligibility?.creditScore || 745;

  const factors = [
    { title: 'On-time Repayment History', impact: 'High Impact', status: '100% on time', positive: true },
    { title: 'Credit Utilization Ratio', impact: 'High Impact', status: '18% utilized', positive: true },
    { title: 'Length of Banking Credit History', impact: 'Medium Impact', status: '4 years 2 months', positive: true },
    { title: 'Recent Hard Inquiries', impact: 'Low Impact', status: '0 in last 6 months', positive: true },
  ];

  return (
    <AdaptiveScreen
      header={
        <ScreenHeader
          title="Credit Bureau Score"
          subtitle="Experian & TransUnion synchronized rating"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
      <Card style={s.scoreCard}>
        <CardContent style={s.scoreContent}>
          <View style={s.scoreCircle}>
            <Text style={s.scoreNum}>{score}</Text>
            <Text style={s.scoreMax}>/ 850</Text>
          </View>
          <Text style={s.ratingText}>Excellent Credit</Text>
          <Text style={s.ratingSub}>Updated automatically on the 1st of every month</Text>
        </CardContent>
      </Card>

      <Text style={s.sectionTitle}>Credit Health Drivers</Text>

      {factors.map((item, idx) => (
        <Card key={idx} style={s.factorCard}>
          <CardContent style={s.factorContent}>
            <View style={s.factorIcon}>
              <Icon name="CheckCircle" size={ICON_SIZES.md} color={theme.colors.success} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={s.factorTitle}>{item.title}</Text>
              <Text style={s.factorSub}>{item.impact}</Text>
            </View>
            <Badge variant="success" size="sm">{item.status}</Badge>
          </CardContent>
        </Card>
      ))}
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    scoreCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: SPACING.xl,
    },
    scoreContent: {
      alignItems: 'center',
      padding: SPACING['2xl'],
    },
    scoreCircle: {
      width: 100,
      height: 100,
      borderRadius: RADIUS.full,
      borderWidth: 4,
      borderColor: theme.colors.success,
      backgroundColor: `${theme.colors.success}10`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.md,
    },
    scoreNum: {
      fontSize: FONT_SIZES.display,
      fontWeight: '800',
      color: theme.colors.success,
    },
    scoreMax: {
      fontSize: FONT_SIZES.micro,
      color: theme.colors.textSecondary,
    },
    ratingText: {
      fontSize: FONT_SIZES.title,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: SPACING.xxs,
    },
    ratingSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.colors.textSecondary,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: SPACING.sm,
    },
    factorCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: SPACING.sm,
    },
    factorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.md,
    },
    factorIcon: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.md,
      backgroundColor: `${theme.colors.success}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    factorTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    factorSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.colors.textSecondary,
      marginTop: SPACING.xxs,
    },
  });
}
