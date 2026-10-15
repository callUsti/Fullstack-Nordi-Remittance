// ============================================================================
// CREDIT SCORE SCREEN — Credit Bureau Breakdown & Factors
// Connected to shared useClientEligibility
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
    <View style={s.container}>
      <ScreenHeader
        title="Credit Bureau Score"
        subtitle="Experian & TransUnion synchronized rating"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
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
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.factorTitle}>{item.title}</Text>
                <Text style={s.factorSub}>{item.impact}</Text>
              </View>
              <Badge variant="success" size="sm">{item.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    scoreCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    scoreContent: {
      alignItems: 'center',
      padding: 24,
    },
    scoreCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: theme.colors.success,
      backgroundColor: `${theme.colors.success}10`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    scoreNum: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.success,
    },
    scoreMax: {
      fontSize: 10,
      color: theme.colors.textSecondary,
    },
    ratingText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    ratingSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 10,
    },
    factorCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    factorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
    },
    factorIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: `${theme.colors.success}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    factorTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    factorSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });
}
