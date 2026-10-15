// ============================================================================
// PAY BILLS & UTILITIES SCREEN — Airtime, Electricity, Internet & Tuition
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useBillingStore } from '@/stores';

const BILL_CATEGORIES = [
  { id: 'airtime', name: 'Mobile Airtime & Data', icon: 'phone-portrait', billers: 'MTN, Vodafone, Safaricom, Airtel' },
  { id: 'power', name: 'Electricity & Gas', icon: 'flash', billers: 'National Grid, KPLC, EKEDC, British Gas' },
  { id: 'internet', name: 'Fiber & Internet', icon: 'wifi', billers: 'Starlink, BT Broadband, Spectranet' },
  { id: 'water', name: 'Water & Utilities', icon: 'water', billers: 'Thames Water, Municipal Council' },
  { id: 'tv', name: 'Cable TV & Streaming', icon: 'tv', billers: 'DStv, Netflix, Sky UK' },
  { id: 'school', name: 'Tuition & Education', icon: 'school', billers: 'University & College fee portals' },
];

export default function PayBillsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const {
    selectedCategory: selectedCat,
    setSelectedCategory: setSelectedCat,
    meterOrPhone,
    setMeterOrPhone,
    billAmount,
    setBillAmount,
  } = useBillingStore();

  const handlePay = (catName: string) => {
    if (!meterOrPhone) {
      Alert.alert('Required', 'Please enter account/meter/phone number.');
      return;
    }

    Alert.alert(
      'Confirm Bill Payment',
      `Pay $${billAmount} for ${catName} (${meterOrPhone})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: () => {
            Alert.alert('Payment Successful', 'Receipt has been issued to your email and ledger updated.');
            setSelectedCat(null);
            setMeterOrPhone('');
          },
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Pay Bills & Utilities"
        subtitle="Instant cross-border bill settlement & airtime"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Text style={s.sectionTitle}>Select Service Category</Text>

        <View style={s.grid}>
          {BILL_CATEGORIES.map((cat) => {
            const isSelected = selectedCat === cat.id;
            return (
              <Card
                key={cat.id}
                style={[s.catCard, isSelected && s.catCardActive]}
              >
                <TouchableOpacity
                  style={s.catContent}
                  onPress={() => setSelectedCat(isSelected ? null : cat.id)}
                >
                  <View style={[s.iconWrap, isSelected && { backgroundColor: `${theme.colors.primary}20` }]}>
                    <Ionicons
                      name={cat.icon as any}
                      size={20}
                      color={isSelected ? theme.colors.primary : theme.colors.textPrimary}
                    />
                  </View>
                  <Text style={[s.catName, isSelected && { color: theme.colors.primary }]}>{cat.name}</Text>
                  <Text style={s.billerText} numberOfLines={2}>{cat.billers}</Text>
                </TouchableOpacity>
              </Card>
            );
          })}
        </View>

        {selectedCat && (
          <Card style={s.paymentCard}>
            <CardContent style={s.paymentContent}>
              <Text style={s.paymentTitle}>Enter Account / Meter ID</Text>
              <TextInput
                value={meterOrPhone}
                onChangeText={setMeterOrPhone}
                style={s.input}
                placeholder="Account number, smart card or phone"
                placeholderTextColor={theme.colors.textSecondary}
              />

              <Text style={[s.paymentTitle, { marginTop: 12 }]}>Amount ($ USD)</Text>
              <TextInput
                value={billAmount}
                onChangeText={setBillAmount}
                style={[s.input, { fontSize: 20, fontWeight: '700' }]}
                keyboardType="decimal-pad"
              />

              <Button
                title={`Pay $${billAmount} Instantly`}
                variant="primary"
                size="lg"
                onPress={() => {
                  const cat = BILL_CATEGORIES.find((c) => c.id === selectedCat);
                  handlePay(cat?.name || 'Bill');
                }}
                style={{ marginTop: 16 }}
              />
            </CardContent>
          </Card>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Button
            title="Setup Autopay Rules"
            variant="outline"
            size="sm"
            onPress={() => router.push('/screens/bills/AutopaySetup' as any)}
            style={{ flex: 1 }}
          />
          <Button
            title="Scheduled Bills"
            variant="outline"
            size="sm"
            onPress={() => router.push('/screens/bills/ScheduledPayments' as any)}
            style={{ flex: 1 }}
          />
        </View>
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
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    catCard: {
      width: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
    catCardActive: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}08`,
    },
    catContent: {
      padding: 14,
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: `${theme.colors.textSecondary}12`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    catName: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    billerText: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      lineHeight: 14,
    },
    paymentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    paymentContent: {
      padding: 16,
    },
    paymentTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 6,
    },
    input: {
      height: 46,
      borderRadius: 10,
      backgroundColor: `${theme.colors.textSecondary}10`,
      paddingHorizontal: 12,
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textPrimary,
    },
  });
}
