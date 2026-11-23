// ============================================================================
// ACCOUNT LIMITS SCREEN — Tier limits, Daily Caps, & Velocity Controls
// Connected to useClientAccountLimits, useClientConsolidatedLimits, useClientCreditScore
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import {
  useClientAccountLimits,
  useClientConsolidatedLimits,
  useClientCreditScore,
} from '@nordi/shared/client-usecase';
import { ICON_SIZES, SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';

export default function AccountLimitsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const { daily, monthly, perTransaction, kycStatus, walletLimits, isLoading, error } =
    useClientAccountLimits();
  const { consolidated } = useClientConsolidatedLimits();
  const { score: creditScore } = useClientCreditScore();

  const isKycApproved = kycStatus === 'approved';

  // Fallback defaults if new user
  const dailyTransferLimit = daily?.transfer?.limit || (isKycApproved ? 50000 : 500);
  const dailyTransferUsed = daily?.transfer?.used || 0;
  const dailyTransferPct = Math.min(Math.round((dailyTransferUsed / dailyTransferLimit) * 100), 100);

  const dailyWithdrawalLimit = daily?.withdrawal?.limit || (isKycApproved ? 10000 : 200);
  const dailyWithdrawalUsed = daily?.withdrawal?.used || 0;
  const dailyWithdrawalPct = Math.min(
    Math.round((dailyWithdrawalUsed / dailyWithdrawalLimit) * 100),
    100
  );

  const monthlyTransferLimit = monthly?.transfer?.limit || (isKycApproved ? 200000 : 2000);
  const monthlyTransferUsed = monthly?.transfer?.used || 0;
  const monthlyTransferPct = Math.min(
    Math.round((monthlyTransferUsed / monthlyTransferLimit) * 100),
    100
  );

  const monthlyWithdrawalLimit = monthly?.withdrawal?.limit || (isKycApproved ? 50000 : 1000);
  const monthlyWithdrawalUsed = monthly?.withdrawal?.used || 0;
  const monthlyWithdrawalPct = Math.min(
    Math.round((monthlyWithdrawalUsed / monthlyWithdrawalLimit) * 100),
    100
  );

  const scoreRating =
    creditScore >= 750
      ? 'Excellent'
      : creditScore >= 670
      ? 'Good'
      : creditScore >= 580
      ? 'Fair'
      : 'Needs Attention';

  return (
    <AdaptiveScreen
      header={
        <ScreenHeader
          title="Limits & Credit Health"
          subtitle="Regulatory velocity caps & credit eligibility"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
      {/* KYC Tier Status Banner */}
      <Card style={s.tierCard}>
        <CardContent style={s.tierContent}>
          <View style={s.tierHeader}>
            <View style={s.tierLeft}>
              <View style={[s.tierIconCircle, { backgroundColor: isKycApproved ? `${theme.success}15` : `${theme.warning}15` }]}>
                <Icon
                  name={isKycApproved ? 'ShieldCheck' : 'Shield'}
                  size={ICON_SIZES.md}
                  color={isKycApproved ? theme.success : theme.warning}
                />
              </View>
              <View>
                <Text style={s.tierTitle}>
                  {isKycApproved ? 'Tier 2 Fully Verified' : 'Tier 1 Standard Account'}
                </Text>
                <Text style={s.tierSub}>
                  {isKycApproved
                    ? 'Maximum transaction bandwidth unlocked'
                    : 'Upgrade verification to unlock up to $200k/mo'}
                </Text>
              </View>
            </View>
            <Badge variant={isKycApproved ? 'success' : 'warning'} size="sm">
              {kycStatus.toUpperCase()}
            </Badge>
          </View>

          {!isKycApproved && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => router.push('/screens/profile' as any)}
              style={{ marginTop: SPACING.sm }}
            >
              Submit ID for Unlimited Limits
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Credit Score Gauge Card */}
      <Card style={s.creditCard}>
        <CardContent style={s.creditContent}>
          <View style={s.creditTop}>
            <View>
              <Text style={s.creditLabel}>FINANCIAL REPUTATION SCORE</Text>
              <Text style={s.creditScoreText}>{creditScore}</Text>
            </View>
            <View style={s.scoreBadgeCol}>
              <Badge variant={creditScore >= 670 ? 'success' : 'warning'} size="md">
                {scoreRating}
              </Badge>
              <Text style={s.scoreScale}>Scale: 300 - 850</Text>
            </View>
          </View>
          <View style={s.scoreProgressBar}>
            <View
              style={[
                s.scoreProgressFill,
                {
                  width: `${Math.min(Math.round(((creditScore - 300) / 550) * 100), 100)}%`,
                  backgroundColor: creditScore >= 670 ? theme.success : theme.warning,
                },
              ]}
            />
          </View>
          <Text style={s.creditDesc}>
            Based on on-time loan repayments, remittance volume, and account longevity. Higher
            scores qualify for instant unsecured loans and increased overdraft limits.
          </Text>
        </CardContent>
      </Card>

      {/* Daily Limits Section */}
      <Text style={s.sectionTitle}>Daily Velocity Meters (Resets at 00:00 UTC)</Text>
      <Card style={s.meterCard}>
        <CardContent style={s.meterContent}>
          {/* Daily Transfer */}
          <View style={s.meterItem}>
            <View style={s.meterRow}>
              <View style={s.meterTitleCol}>
                <Icon name="ArrowUpRight" size={ICON_SIZES.sm} color={theme.primary} />
                <Text style={s.meterTitle}>Daily Outgoing Transfer</Text>
              </View>
              <Text style={s.meterAmounts}>
                ${dailyTransferUsed.toLocaleString()} / ${dailyTransferLimit.toLocaleString()}
              </Text>
            </View>
            <View style={s.meterBar}>
              <View
                style={[
                  s.meterFill,
                  {
                    width: `${dailyTransferPct}%`,
                    backgroundColor: dailyTransferPct > 80 ? theme.danger : theme.primary,
                  },
                ]}
              />
            </View>
            <Text style={s.meterRemaining}>
              ${Math.max(0, dailyTransferLimit - dailyTransferUsed).toLocaleString()} remaining today
            </Text>
          </View>

          <View style={s.divider} />

          {/* Daily Withdrawal */}
          <View style={s.meterItem}>
            <View style={s.meterRow}>
              <View style={s.meterTitleCol}>
                <Icon name="CreditCard" size={ICON_SIZES.sm} color={theme.success} />
                <Text style={s.meterTitle}>Daily Cash & ATM Withdrawal</Text>
              </View>
              <Text style={s.meterAmounts}>
                ${dailyWithdrawalUsed.toLocaleString()} / ${dailyWithdrawalLimit.toLocaleString()}
              </Text>
            </View>
            <View style={s.meterBar}>
              <View
                style={[
                  s.meterFill,
                  {
                    width: `${dailyWithdrawalPct}%`,
                    backgroundColor: dailyWithdrawalPct > 80 ? theme.danger : theme.success,
                  },
                ]}
              />
            </View>
            <Text style={s.meterRemaining}>
              ${Math.max(0, dailyWithdrawalLimit - dailyWithdrawalUsed).toLocaleString()} remaining today
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Monthly Limits Section */}
      <Text style={s.sectionTitle}>Monthly Compliance Caps</Text>
      <Card style={s.meterCard}>
        <CardContent style={s.meterContent}>
          {/* Monthly Transfer */}
          <View style={s.meterItem}>
            <View style={s.meterRow}>
              <View style={s.meterTitleCol}>
                <Icon name="Building" size={ICON_SIZES.sm} color={theme.primary} />
                <Text style={s.meterTitle}>Monthly Remittance Volume</Text>
              </View>
              <Text style={s.meterAmounts}>
                ${monthlyTransferUsed.toLocaleString()} / ${monthlyTransferLimit.toLocaleString()}
              </Text>
            </View>
            <View style={s.meterBar}>
              <View
                style={[
                  s.meterFill,
                  {
                    width: `${monthlyTransferPct}%`,
                    backgroundColor: monthlyTransferPct > 80 ? theme.danger : theme.primary,
                  },
                ]}
              />
            </View>
          </View>

          <View style={s.divider} />

          {/* Monthly Withdrawal */}
          <View style={s.meterItem}>
            <View style={s.meterRow}>
              <View style={s.meterTitleCol}>
                <Icon name="Receipt" size={ICON_SIZES.sm} color={theme.success} />
                <Text style={s.meterTitle}>Monthly Withdrawal Cap</Text>
              </View>
              <Text style={s.meterAmounts}>
                ${monthlyWithdrawalUsed.toLocaleString()} / ${monthlyWithdrawalLimit.toLocaleString()}
              </Text>
            </View>
            <View style={s.meterBar}>
              <View
                style={[
                  s.meterFill,
                  {
                    width: `${monthlyWithdrawalPct}%`,
                    backgroundColor: monthlyWithdrawalPct > 80 ? theme.danger : theme.success,
                  },
                ]}
              />
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Single Transaction Ceiling */}
      <Card style={s.ceilingCard}>
        <CardContent style={s.ceilingContent}>
          <View style={s.ceilingLeft}>
            <Icon name="ShieldCheck" size={ICON_SIZES.md} color={theme.primary} />
            <View>
              <Text style={s.ceilingTitle}>Per-Transaction Security Cap</Text>
              <Text style={s.ceilingSub}>Single payment authorization limit</Text>
            </View>
          </View>
          <Text style={s.ceilingVal}>
            ${(perTransaction || (isKycApproved ? 25000 : 200)).toLocaleString()}
          </Text>
        </CardContent>
      </Card>
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    tierCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    tierContent: {
      padding: SPACING.md,
    },
    tierHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tierLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      flex: 1,
    },
    tierIconCircle: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tierTitle: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '700',
      color: theme.text,
    },
    tierSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      marginTop: 2,
    },
    creditCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    creditContent: {
      padding: SPACING.md,
    },
    creditTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.sm,
    },
    creditLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.textMuted,
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    creditScoreText: {
      fontSize: 32,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: -0.5,
    },
    scoreBadgeCol: {
      alignItems: 'flex-end',
    },
    scoreScale: {
      fontSize: 10,
      color: theme.textMuted,
      marginTop: 4,
    },
    scoreProgressBar: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.background,
      overflow: 'hidden',
      marginBottom: SPACING.sm,
    },
    scoreProgressFill: {
      height: '100%',
      borderRadius: 4,
    },
    creditDesc: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      lineHeight: 16,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '700',
      color: theme.text,
      marginTop: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    meterCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    meterContent: {
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    meterItem: {
      gap: SPACING.xs,
    },
    meterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    meterTitleCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    meterTitle: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '600',
      color: theme.text,
    },
    meterAmounts: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '700',
      color: theme.text,
    },
    meterBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.background,
      overflow: 'hidden',
    },
    meterFill: {
      height: '100%',
      borderRadius: 3,
    },
    meterRemaining: {
      fontSize: 10,
      color: theme.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: SPACING.xs,
    },
    ceilingCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING['3xl'],
    },
    ceilingContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.md,
    },
    ceilingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    ceilingTitle: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '700',
      color: theme.text,
    },
    ceilingSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
    },
    ceilingVal: {
      fontSize: FONT_SIZES.title,
      fontWeight: '800',
      color: theme.primary,
    },
  });
}
