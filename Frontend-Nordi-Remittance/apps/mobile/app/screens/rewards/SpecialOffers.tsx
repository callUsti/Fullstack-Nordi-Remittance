// ============================================================================
// SPECIAL OFFERS — Limited-time promotions & bonus campaigns
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

const OFFERS = [
  {
    id: '1',
    title: '2X Points Weekend',
    desc: 'Earn double points on all transfers this weekend only.',
    endsIn: '2d 14h',
    label: 'HOT',
    labelVariant: 'danger' as const,
    icon: 'flash-outline',
    color: '#ef4444',
  },
  {
    id: '2',
    title: 'Refer & Earn',
    desc: 'Invite a friend and earn 500 bonus points when they complete their first transfer.',
    endsIn: 'Ongoing',
    label: 'NEW',
    labelVariant: 'success' as const,
    icon: 'people-outline',
    color: '#10b981',
  },
  {
    id: '3',
    title: 'First FX Trade Bonus',
    desc: 'Get 300 points on your first currency exchange transaction above $200.',
    endsIn: '6d left',
    label: 'LIMITED',
    labelVariant: 'warning' as const,
    icon: 'trending-up-outline',
    color: '#f59e0b',
  },
];

export default function SpecialOffersScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Special Offers"
        subtitle="Time-sensitive promotions & bonuses"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {OFFERS.map((offer) => (
          <Card key={offer.id} style={s.card}>
            <CardContent style={s.cardContent}>
              <View style={[s.offerIcon, { backgroundColor: `${offer.color}20` }]}>
                <Ionicons name={offer.icon as any} size={24} color={offer.color} />
              </View>
              <View style={s.offerInfo}>
                <View style={s.offerHeader}>
                  <Text style={s.offerTitle}>{offer.title}</Text>
                  <Badge variant={offer.labelVariant} size="sm">{offer.label}</Badge>
                </View>
                <Text style={s.offerDesc}>{offer.desc}</Text>
                <View style={s.offerFooter}>
                  <View style={s.countdown}>
                    <Ionicons name="alarm-outline" size={12} color={theme.colors.textSecondary} />
                    <Text style={s.countdownText}>{offer.endsIn}</Text>
                  </View>
                  <TouchableOpacity
                    style={s.activateBtn}
                    onPress={() => Alert.alert('Offer Activated!', `The "${offer.title}" offer has been activated on your account.`)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.activateText}>Activate</Text>
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
    cardContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
    offerIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    offerInfo: { flex: 1, gap: 6 },
    offerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    offerTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
    offerDesc: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 17 },
    offerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    countdown: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    countdownText: { fontSize: 11, color: theme.colors.textSecondary },
    activateBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
    activateText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  });
}
