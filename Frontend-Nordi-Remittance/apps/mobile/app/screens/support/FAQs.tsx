// ============================================================================
// FAQs — Frequently Asked Questions with expandable items
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { SearchInput } from '@/components/shared/SearchInput';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQ[] = [
  { id: '1', category: 'Transfers', question: 'How long do international transfers take?', answer: 'Most international transfers are processed within 1–3 business days. Express transfers can be completed within 24 hours for an additional fee.' },
  { id: '2', category: 'Transfers', question: 'What are the transfer limits?', answer: 'Daily transfer limits vary by account tier. Basic accounts: $5,000/day. Verified accounts: $50,000/day. Premium accounts: $250,000/day.' },
  { id: '3', category: 'Account', question: 'How do I upgrade my account tier?', answer: 'To upgrade, complete full KYC verification by submitting your government ID, proof of address, and a selfie. Upgrades are processed within 24 hours.' },
  { id: '4', category: 'Security', question: 'What should I do if I suspect fraudulent activity?', answer: 'Immediately contact our 24/7 support line at +234 800 NORDI 00 or freeze your account via the Security Center. We will investigate and restore your funds if applicable.' },
  { id: '5', category: 'Fees', question: 'What are the transaction fees?', answer: 'Domestic transfers: free. International transfers: 0.5% of amount (min $2, max $30). Currency exchange: mid-market rate + 1% spread.' },
  { id: '6', category: 'Cards', question: 'How do I get a virtual card?', answer: 'Virtual cards can be created instantly in the Cards section. Physical cards are delivered within 5–7 business days and are free for verified accounts.' },
];

export default function FAQsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = FAQS.filter((f) =>
    !search || f.question.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <View style={s.container}>
      <ScreenHeader
        title="FAQs"
        subtitle="Find answers to common questions"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search questions..."
          style={s.search}
        />

        {filtered.map((faq) => (
          <TouchableOpacity
            key={faq.id}
            activeOpacity={0.8}
            onPress={() => toggle(faq.id)}
          >
            <Card style={[s.card, expanded === faq.id && s.cardExpanded]}>
              <CardContent style={s.cardContent}>
                <View style={s.questionRow}>
                  <Text style={s.question}>{faq.question}</Text>
                  <Ionicons
                    name={expanded === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </View>
                {expanded === faq.id && (
                  <Text style={s.answer}>{faq.answer}</Text>
                )}
              </CardContent>
            </Card>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="search-outline" size={36} color={theme.colors.textSecondary} />
            <Text style={s.emptyText}>No results found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    search: { marginBottom: 16 },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    cardExpanded: { borderColor: `${theme.colors.primary}40` },
    cardContent: { padding: 14 },
    questionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    question: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, lineHeight: 18 },
    answer: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18, marginTop: 10 },
    empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
    emptyText: { fontSize: 14, color: theme.colors.textSecondary },
  });
}
