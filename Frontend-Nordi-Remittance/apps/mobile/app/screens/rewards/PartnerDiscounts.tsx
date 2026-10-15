// ============================================================================
// PARTNER DISCOUNTS — Exclusive deals and partner offers
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const PARTNERS = [
  { id: '1', name: 'Jumia', category: 'Shopping', discount: '15% OFF', desc: 'Use 500 points for a 15% discount on any order above $30', icon: 'storefront-outline', expires: 'Expires Dec 31', color: '#f97316' },
  { id: '2', name: 'Netflix', category: 'Entertainment', discount: '1 Month FREE', desc: 'Redeem 2,000 points for one free month of Netflix Premium', icon: 'tv-outline', expires: 'Expires Nov 30', color: '#e50914' },
  { id: '3', name: 'Emirates', category: 'Travel', discount: '5% OFF Flights', desc: '1,500 points for 5% off any Emirates flight booking', icon: 'airplane-outline', expires: 'Ongoing', color: '#c8102e' },
  { id: '4', name: 'Uber Eats', category: 'Food', discount: 'Free Delivery', desc: 'Exchange 300 points for free delivery on your next 3 orders', icon: 'bicycle-outline', expires: 'Expires Jan 15', color: '#06b6d4' },
];

export default function PartnerDiscountsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Partner Discounts"
        subtitle="Exclusive deals from our partners"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {PARTNERS.map((partner) => (
          <Card key={partner.id} style={s.card}>
            <CardContent style={s.cardContent}>
              <View style={[s.partnerIcon, { backgroundColor: `${partner.color}20` }]}>
                <Ionicons name={partner.icon as any} size={26} color={partner.color} />
              </View>
              <View style={s.partnerInfo}>
                <View style={s.partnerHeader}>
                  <Text style={s.partnerName}>{partner.name}</Text>
                  <Badge variant="secondary" size="sm">{partner.category}</Badge>
                </View>
                <Text style={s.discount}>{partner.discount}</Text>
                <Text style={s.desc}>{partner.desc}</Text>
                <View style={s.footer}>
                  <View style={s.expiryRow}>
                    <Ionicons name="time-outline" size={11} color={theme.colors.textSecondary} />
                    <Text style={s.expiry}>{partner.expires}</Text>
                  </View>
                  <TouchableOpacity
                    style={s.claimBtn}
                    onPress={() => Alert.alert('Claimed!', `You have claimed the ${partner.name} discount.`)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.claimText}>Claim</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    cardContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
    partnerIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    partnerInfo: { flex: 1, gap: 4 },
    partnerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    partnerName: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
    discount: { fontSize: 16, fontWeight: '800', color: theme.colors.primary },
    desc: { fontSize: 11, color: theme.colors.textSecondary, lineHeight: 16 },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    expiry: { fontSize: 10, color: theme.colors.textSecondary },
    claimBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
    claimText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  });
}
