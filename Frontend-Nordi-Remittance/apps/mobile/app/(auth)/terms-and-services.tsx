// ============================================================================
// TERMS AND SERVICES SCREEN — Nordea / Nordi Remittance (Mobile)
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
  FileText,
  ArrowLeft,
  Calendar,
  FileCheck2,
  DollarSign,
  Scale,
  AlertTriangle,
  Send,
  CheckCircle2,
} from 'lucide-react-native';

// Reusable UI Components
import { Button, Card, Badge, ScreenLoader } from '@/components/ui';
import { NetworkStatusBanner } from '@/components/shared';

// Shared API queries & stores
import { useTermsAndConditions, useAcceptTerms } from '@nordi/shared/hooks/api-queries/useLegal';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { colors } from '@nordi/shared/constants/colors';
import { useToastStore } from '@nordi/shared/store/toast.store';

export default function TermsAndServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useMobileTheme();
  const { showToast } = useToastStore();

  const [hasAccepted, setHasAccepted] = useState(false);

  // Legal API Query for Terms & Conditions
  const {
    data: legalData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useTermsAndConditions();

  const acceptMutation = useAcceptTerms();

  const version = legalData?.version || 'v3.1.0';
  const effectiveDate = legalData?.effectiveDate
    ? new Date(legalData.effectiveDate).toLocaleDateString()
    : 'September 1, 2026';
  const lastUpdated = legalData?.lastUpdated
    ? new Date(legalData.lastUpdated).toLocaleDateString()
    : 'October 12, 2026';

  const termsContent = useMemo(() => {
    if (legalData?.content) {
      return legalData.content;
    }
    return 'These Terms of Service govern your access to and use of Nordi Remittance mobile and web cross-border payment platforms. By maintaining an active account, you accept these terms.';
  }, [legalData]);

  const clauses = [
    {
      icon: Send,
      title: '1. Service Scope & Execution',
      body: 'Nordi Remittance provides domestic and cross-border currency transfers, FX conversion, and account holding facilities. Transfers are initiated upon complete debit authorization and are subject to clearing system processing windows.',
    },
    {
      icon: Scale,
      title: '2. Identity Verification & Compliance',
      body: 'Users must furnish accurate, verifiable legal identity records to satisfy Anti-Money Laundering (AML) and Counter-Financing of Terrorism (CFT) requirements. Unverified accounts cannot initiate cross-border transactions exceeding baseline thresholds.',
    },
    {
      icon: DollarSign,
      title: '3. Exchange Rates & Fees',
      body: 'Exchange rates displayed during the transfer preview include real-time interbank spreads locked for a maximum of 60 seconds. Transaction processing fees are transparently disclosed prior to final PIN/Biometric authorization.',
    },
    {
      icon: AlertTriangle,
      title: '4. Prohibited Uses & Account Holds',
      body: 'Accounts must not be used for illicit gambling, sanction evasion, or unauthorized high-frequency financial automation. Nordi Remittance reserves statutory authority to place temporary holds on flagged transactions.',
    },
  ];

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync({
        documentType: 'terms_of_service',
        version,
      });
      setHasAccepted(true);
      showToast('Terms of Service accepted', 'success');
    } catch {
      setHasAccepted(true);
      showToast('Terms accepted locally', 'info');
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
            Terms & Services
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            Nordi Remittance Master Service Agreement
          </Text>
        </View>
        <View style={styles.headerAction}>
          <FileText size={22} color={colors.primary[500]} />
        </View>
      </View>

      {isLoading ? (
        <ScreenLoader message="Loading terms of service..." />
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.text }]}>
            Failed to load Terms of Service
          </Text>
          <Text style={[styles.errorDescription, { color: theme.textMuted }]}>
            {error instanceof Error ? error.message : 'Please check your connection and retry.'}
          </Text>
          <Button variant="primary" size="md" onPress={() => refetch()}>
            Retry
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
          {/* Metadata Card */}
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
                    Revision:
                  </Text>
                </View>
                <View style={styles.versionBadge}>
                  <Badge variant="primary" size="sm">
                    {version}
                  </Badge>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.metaSubtext, { color: theme.textMuted }]}>
              Last updated {lastUpdated}. Regulated by International Monetary Authorities.
            </Text>
          </Card>

          {/* Master Scope Statement */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Agreement Overview
            </Text>
            <Text style={[styles.bodyText, { color: theme.textMuted }]}>
              {termsContent}
            </Text>
          </View>

          {/* Legal Clauses */}
          {clauses.map((clause, index) => {
            const ClauseIcon = clause.icon;
            return (
              <Card
                key={index}
                variant="default"
                size="md"
                style={[styles.clauseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.clauseHeader}>
                  <View
                    style={[
                      styles.clauseIconCircle,
                      { backgroundColor: `${colors.primary[500]}15` },
                    ]}
                  >
                    <ClauseIcon size={18} color={colors.primary[500]} />
                  </View>
                  <Text style={[styles.clauseTitle, { color: theme.text }]}>
                    {clause.title}
                  </Text>
                </View>
                <Text style={[styles.clauseBody, { color: theme.textMuted }]}>
                  {clause.body}
                </Text>
              </Card>
            );
          })}

          {/* Action Button */}
          <View style={styles.actionBlock}>
            <Button
              variant={hasAccepted ? 'outline' : 'primary'}
              size="lg"
              fullWidth
              isLoading={acceptMutation.isPending}
              isDisabled={hasAccepted}
              onPress={handleAccept}
              leftIcon={
                hasAccepted ? (
                  <CheckCircle2 size={18} color={colors.success[500]} />
                ) : (
                  <FileCheck2 size={18} color="#fff" />
                )
              }
            >
              {hasAccepted ? 'Terms Accepted' : 'Agree to Terms & Continue'}
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
  clauseCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  clauseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  clauseIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clauseTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  clauseBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionBlock: {
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
