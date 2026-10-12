// ============================================================================
// PRIVACY POLICY SCREEN — Nordea / Nordi Remittance (Mobile)
// Connected with Legal API via @nordi/shared useLegal hooks & LegalRepository
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Shield,
  ArrowLeft,
  Calendar,
  FileCheck2,
  Lock,
  Eye,
  Share2,
  Database,
  CheckCircle2,
} from 'lucide-react-native';

// Reusable UI Components
import { Button, Card, Badge, ScreenLoader } from '@/components/ui';
import { NetworkStatusBanner } from '@/components/shared';

// Shared API queries & stores
import { usePrivacyPolicy, useAcceptTerms } from '@nordi/shared/hooks/api-queries/useLegal';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { colors } from '@nordi/shared/constants/colors';
import { useToastStore } from '@nordi/shared/store/toast.store';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useMobileTheme();
  const { showToast } = useToastStore();

  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  // Legal API Query
  const {
    data: legalData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = usePrivacyPolicy();

  const acceptTermsMutation = useAcceptTerms();

  // Fallback default sections if backend returns summary or raw string
  const policyContent = useMemo(() => {
    if (legalData?.content) {
      return legalData.content;
    }
    return `We at Nordi Remittance are committed to safeguarding your personal data and financial privacy in accordance with global banking standards, GDPR, and AML/KYC regulatory frameworks.`;
  }, [legalData]);

  const version = legalData?.version || 'v2.4.1';
  const effectiveDate = legalData?.effectiveDate
    ? new Date(legalData.effectiveDate).toLocaleDateString()
    : 'October 1, 2026';
  const lastUpdated = legalData?.lastUpdated
    ? new Date(legalData.lastUpdated).toLocaleDateString()
    : 'October 12, 2026';

  const policySections = [
    {
      icon: Eye,
      title: '1. Information We Collect',
      body: 'We collect personal identification details (name, email, phone, government ID for KYC), financial and transaction details, and device metrics required to protect your account from fraud.',
    },
    {
      icon: Lock,
      title: '2. How We Protect Your Data',
      body: 'All communications are protected using end-to-end TLS 1.3 encryption and AES-256 storage standards. Financial tokens are segregated into dedicated hardware security modules (HSM).',
    },
    {
      icon: Share2,
      title: '3. Data Sharing & Third Parties',
      body: 'Your sensitive financial records are never sold. Data is shared exclusively with accredited clearing houses, licensed banking partners, and statutory authorities when mandated by anti-money laundering (AML) law.',
    },
    {
      icon: Database,
      title: '4. Data Retention & Privacy Rights',
      body: 'Under GDPR and statutory financial regulations, you retain the right to inspect, export, or request deletion of your records subject to minimum statutory compliance periods.',
    },
  ];

  const handleAcknowledge = async () => {
    try {
      await acceptTermsMutation.mutateAsync({
        documentType: 'privacy_policy',
        version,
      });
      setHasAcknowledged(true);
      showToast('Privacy Policy acknowledged successfully', 'success');
    } catch {
      // Local fallback acknowledgement
      setHasAcknowledged(true);
      showToast('Privacy Policy acknowledged locally', 'info');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NetworkStatusBanner />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.background }]}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Privacy Policy
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            Nordi Remittance & Financial Security
          </Text>
        </View>
        <View style={styles.headerAction}>
          <Shield size={22} color={colors.primary[500]} />
        </View>
      </View>

      {isLoading ? (
        <ScreenLoader message="Fetching legal privacy terms..." />
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.text }]}>
            Unable to load live document
          </Text>
          <Text style={[styles.errorDescription, { color: theme.textMuted }]}>
            {error instanceof Error ? error.message : 'A network error occurred.'}
          </Text>
          <Button variant="primary" size="md" onPress={() => refetch()}>
            Retry Loading
          </Button>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary[500]}
            />
          }
        >
          {/* Version & Date Card */}
          <Card variant="outlined" size="sm" style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <View style={styles.inlineRow}>
                  <Calendar size={14} color={theme.iconMuted} />
                  <Text style={[styles.metaLabel, { color: theme.textMuted }]}>
                    Effective Date:
                  </Text>
                </View>
                <Text style={[styles.metaValue, { color: theme.text }]}>
                  {effectiveDate}
                </Text>
              </View>

              <View style={styles.metaCol}>
                <View style={styles.inlineRow}>
                  <FileCheck2 size={14} color={theme.iconMuted} />
                  <Text style={[styles.metaLabel, { color: theme.textMuted }]}>
                    Document Version:
                  </Text>
                </View>
                <View style={styles.versionBadge}>
                  <Badge variant="info" size="sm">
                    {version}
                  </Badge>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.metaSubtext, { color: theme.textMuted }]}>
              Last updated on {lastUpdated}. Applicable to all registered accounts.
            </Text>
          </Card>

          {/* Overview Statement */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Our Commitment to Your Privacy
            </Text>
            <Text style={[styles.bodyText, { color: theme.textMuted }]}>
              {policyContent}
            </Text>
          </View>

          {/* Core Privacy Pillars */}
          {policySections.map((sec, idx) => {
            const SecIcon = sec.icon;
            return (
              <Card
                key={idx}
                variant="default"
                size="md"
                style={[styles.pillarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.pillarHeader}>
                  <View
                    style={[
                      styles.pillarIconCircle,
                      { backgroundColor: `${colors.primary[500]}15` },
                    ]}
                  >
                    <SecIcon size={20} color={colors.primary[500]} />
                  </View>
                  <Text style={[styles.pillarTitle, { color: theme.text }]}>
                    {sec.title}
                  </Text>
                </View>
                <Text style={[styles.pillarBody, { color: theme.textMuted }]}>
                  {sec.body}
                </Text>
              </Card>
            );
          })}

          {/* Action / Acceptance Confirmation */}
          <View style={styles.acknowledgementBlock}>
            <Button
              variant={hasAcknowledged ? 'outline' : 'primary'}
              size="lg"
              fullWidth
              isLoading={acceptTermsMutation.isPending}
              isDisabled={hasAcknowledged}
              onPress={handleAcknowledge}
              leftIcon={
                hasAcknowledged ? (
                  <CheckCircle2 size={18} color={colors.success[500]} />
                ) : (
                  <Shield size={18} color="#fff" />
                )
              }
            >
              {hasAcknowledged ? 'Policy Acknowledged' : 'I Understand & Accept Policy'}
            </Button>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  headerAction: {
    padding: 6,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  metaCard: {
    marginBottom: 20,
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  versionBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  metaSubtext: {
    fontSize: 11,
    lineHeight: 16,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  pillarCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  pillarIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  pillarBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  acknowledgementBlock: {
    marginTop: 12,
    marginBottom: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
});
