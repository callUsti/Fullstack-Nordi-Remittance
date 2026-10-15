// ============================================================================
// REDEEM POINTS — Exchange points for cash, vouchers or airtime
// ============================================================================
import React, { useState } from 'react';
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
import { Button } from '@/components/ui/Button';

const OPTIONS = [
  { id: 'cash', icon: 'cash-outline', label: 'Cash Back', desc: 'Transfer points to your Nordi wallet', rate: '100 pts = $1.00', min: 1000, color: '#10b981' },
  { id: 'airtime', icon: 'phone-portrait-outline', label: 'Airtime Top-Up', desc: 'Redeem for mobile airtime/data', rate: '100 pts = $1.20', min: 500, color: '#6366f1' },
  { id: 'voucher', icon: 'ticket-outline', label: 'Gift Voucher', desc: 'Amazon, Jumia, and more', rate: '100 pts = $1.50', min: 2000, color: '#f59e0b' },
  { id: 'fee', icon: 'arrow-down-circle-outline', label: 'Fee Waiver', desc: 'Waive your next transfer fee', rate: '500 pts / waiver', min: 500, color: '#ec4899' },
];

export default function RedeemPointsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);
  const [selected, setSelected] = useState('cash');
  const balance = 12450;

  const option = OPTIONS.find((o) => o.id === selected)!;

  const handleRedeem = () => {
    if (balance < option.min) {
      Alert.alert('Insufficient Points', `You need at least ${option.min} points to redeem this option.`);
      return;
    }
    Alert.alert('Confirm Redemption', `Redeem ${option.min} points for ${option.label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => Alert.alert('Success', 'Points redeemed successfully!') },
    ]);
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Redeem Points"
        subtitle="Exchange your earned points"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Card style={s.balanceCard}>
          <CardContent style={s.balanceContent}>
            <Text style={s.balanceLabel}>Available Points</Text>
            <Text style={s.balanceValue}>{balance.toLocaleString()} pts</Text>
            <Text style={s.balanceEquiv}>≈ ${(balance / 100).toFixed(2)} value</Text>
          </CardContent>
        </Card>

        <Text style={s.sectionLabel}>Redemption Options</Text>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[s.optCard, selected === opt.id && s.optCardActive]}
            onPress={() => setSelected(opt.id)}
            activeOpacity={0.8}
          >
            <View style={[s.optIcon, { backgroundColor: `${opt.color}20` }]}>
              <Ionicons name={opt.icon as any} size={22} color={opt.color} />
            </View>
            <View style={s.optText}>
              <Text style={s.optLabel}>{opt.label}</Text>
              <Text style={s.optDesc}>{opt.desc}</Text>
              <Text style={s.optRate}>{opt.rate}</Text>
            </View>
            <View style={[s.radio, selected === opt.id && s.radioActive]}>
              {selected === opt.id && <View style={s.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        <Button variant="primary" onPress={handleRedeem} style={s.redeemBtn}>
          Redeem {option.min.toLocaleString()} Points
        </Button>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    balanceCard: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      marginBottom: 20,
      borderWidth: 0,
    },
    balanceContent: { alignItems: 'center', padding: 20, gap: 4 },
    balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    balanceValue: { fontSize: 32, fontWeight: '800', color: '#fff' },
    balanceEquiv: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    optCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 14,
      marginBottom: 10,
      gap: 12,
    },
    optCardActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}08` },
    optIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    optText: { flex: 1 },
    optLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },
    optDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    optRate: { fontSize: 11, color: theme.colors.primary, fontWeight: '600', marginTop: 4 },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioActive: { borderColor: theme.colors.primary },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
    redeemBtn: { marginTop: 4 },
  });
}
