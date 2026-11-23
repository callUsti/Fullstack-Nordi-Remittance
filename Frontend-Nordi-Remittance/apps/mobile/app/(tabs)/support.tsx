// ============================================================================
// SUPPORT & CONCIERGE SCREEN — Nordi Remittance Mobile
// Ultra-minimalist 24/7 AI assistant, live routing, emergency card locks & FAQs
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { Icon } from '@/components/ui/Icon';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SPACING, FONT_SIZES, ICON_SIZES, RADIUS } from '@/constants/sizings';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function SupportScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('1');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setRefreshing(false);
  };

  const supportCategories = [
    { icon: 'CreditCard', label: 'Cards & Limits', route: '/screens/cards/index' },
    { icon: 'ArrowRightLeft', label: 'Transfers', route: '/screens/send-money/index' },
    { icon: 'ShieldCheck', label: 'Account Safety', route: '/screens/security/index' },
    { icon: 'FileText', label: 'Statements', route: '/screens/accounts/AccountStatements' },
  ];

  const faqs: FAQItem[] = [
    {
      id: '1',
      category: 'Security',
      question: 'How do I immediately freeze a compromised card?',
      answer: 'Go to Cards tab or tap the Emergency Lock button below. Your virtual and physical card numbers will be deactivated instantly without affecting your wallet funds.',
    },
    {
      id: '2',
      category: 'Remittances',
      question: 'What are the cross-border delivery times?',
      answer: 'SWIFT and SEPA transfers settle within 1-24 hours depending on the destination currency corridor. Crypto & InstantPay settle in under 60 seconds.',
    },
    {
      id: '3',
      category: 'Limits',
      question: 'How do I raise my daily withdrawal limit?',
      answer: 'Tier 2 KYC verification unlocks up to $50,000 daily limits. You can complete identity verification in Profile > Document Center in 2 minutes.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdaptiveScreen withTabBar={true} onRefresh={onRefresh} refreshing={refreshing}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerSubtitle}>24/7 CONCIERGE & HELP</Text>
          <Text style={styles.headerTitle}>Support Center</Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/(auth)/contact')}
          activeOpacity={0.7}
        >
          <Icon name="MessageSquare" size={ICON_SIZES.sm} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* AI Assistant Banner */}
      <Card style={styles.aiCard}>
        <CardContent style={styles.aiContent}>
          <View style={styles.aiRow}>
            <View style={[styles.aiIconBox, { backgroundColor: theme.primarySoft }]}>
              <Icon name="Sparkles" size={ICON_SIZES.md} color={theme.primary} />
            </View>
            <View style={styles.aiTextCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.aiTitle}>Nordi AI Concierge</Text>
                <Badge variant="success" size="sm" style={{ marginLeft: 6 }}>Online 24/7</Badge>
              </View>
              <Text style={styles.aiSub}>Instant answers for fees, transfers, and identity issues.</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.aiLaunchBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/(auth)/contact')}
            activeOpacity={0.8}
          >
            <Text style={styles.aiLaunchText}>Start AI Chat</Text>
            <Icon name="ArrowRight" size={ICON_SIZES.nano} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </CardContent>
      </Card>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Icon name="Search" size={ICON_SIZES.sm} color={theme.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search questions or keywords..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <Icon name="X" size={ICON_SIZES.nano} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Category Hub */}
      <View style={styles.categoryGrid}>
        {supportCategories.map((cat, i) => (
          <TouchableOpacity
            key={i}
            style={styles.categoryTile}
            onPress={() => router.push(cat.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconBox, { backgroundColor: theme.surfaceAlt }]}>
              <Icon name={cat.icon} size={ICON_SIZES.sm} color={theme.primary} />
            </View>
            <Text style={styles.tileLabel}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FAQs Section */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeading}>FREQUENTLY ASKED QUESTIONS</Text>
        <Card style={styles.faqCard}>
          <CardContent style={{ paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md }}>
            {filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedFaq === faq.id;
              const isLast = idx === filteredFaqs.length - 1;
              return (
                <View key={faq.id} style={[styles.faqItem, !isLast && styles.faqBorder]}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => setExpandedFaq(isExpanded ? null : faq.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Icon
                      name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                      size={ICON_SIZES.xs}
                      color={theme.textMuted}
                    />
                  </TouchableOpacity>
                  {isExpanded && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </View>
              );
            })}
          </CardContent>
        </Card>
      </View>

      {/* Emergency Freeze Assistance */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeading}>URGENT DISPATCH</Text>
        <Card style={[styles.emergencyCard, { backgroundColor: theme.dangerSoft, borderColor: `${theme.danger}40` }]}>
          <CardContent style={styles.emergencyContent}>
            <View style={styles.emergencyLeft}>
              <View style={[styles.emergencyIcon, { backgroundColor: `${theme.danger}20` }]}>
                <Icon name="ShieldAlert" size={ICON_SIZES.sm} color={theme.danger} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={[styles.emergencyTitle, { color: theme.danger }]}>Emergency Card Freeze</Text>
                <Text style={styles.emergencySub}>Lock all physical and virtual cards in 1-tap</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.emergencyBtn, { backgroundColor: theme.danger }]}
              onPress={() => {
                Alert.alert('Card Security', 'Navigating to Card Security Manager', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Manage Cards', onPress: () => router.push('/screens/cards/CardSecurity') },
                ]);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.emergencyBtnText}>Lock Cards</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>
      </View>
    </AdaptiveScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    topHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.lg,
      marginTop: SPACING.xs,
    },
    headerSubtitle: {
      fontSize: FONT_SIZES.nano,
      letterSpacing: 1.2,
      fontWeight: '700',
      color: theme.primary,
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: FONT_SIZES.hero,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.5,
    },
    headerBtn: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    aiContent: {
      padding: SPACING.md,
    },
    aiRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    aiIconBox: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.sm,
    },
    aiTextCol: {
      flex: 1,
    },
    aiTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      color: theme.text,
    },
    aiSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      marginTop: 2,
    },
    aiLaunchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADIUS.md,
      marginTop: SPACING.xs,
    },
    aiLaunchText: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      marginBottom: SPACING.md,
    },
    searchInput: {
      flex: 1,
      marginLeft: SPACING.xs,
      fontSize: FONT_SIZES.body,
      color: theme.text,
      padding: 0,
    },
    categoryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: SPACING.lg,
    },
    tileIconBox: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.xs,
    },
    categoryTile: {
      flex: 1,
      marginHorizontal: 3,
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xxs,
    },
    tileLabel: {
      fontSize: FONT_SIZES.nano,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
    },
    sectionWrap: {
      marginBottom: SPACING.lg,
    },
    sectionHeading: {
      fontSize: FONT_SIZES.micro,
      fontWeight: '700',
      letterSpacing: 1,
      color: theme.textMuted,
      marginBottom: SPACING.xs,
      marginLeft: SPACING.xxs,
    },
    faqCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    faqItem: {
      paddingVertical: SPACING.sm,
    },
    faqBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    faqQuestion: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
      marginRight: SPACING.xs,
    },
    faqAnswer: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      lineHeight: 18,
      marginTop: SPACING.xs,
    },
    emergencyCard: {
      borderRadius: RADIUS.lg,
      borderWidth: 1,
    },
    emergencyContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING.md,
    },
    emergencyLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: SPACING.xs,
    },
    emergencyIcon: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emergencyTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
    },
    emergencySub: {
      fontSize: FONT_SIZES.nano,
      color: theme.textMuted,
      marginTop: 2,
    },
    emergencyBtn: {
      paddingVertical: SPACING.xs + 1,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.sm,
    },
    emergencyBtnText: {
      fontSize: FONT_SIZES.nano,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
