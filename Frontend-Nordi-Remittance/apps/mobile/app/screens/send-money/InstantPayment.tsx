// ============================================================================
// ACCESS SWIFTPAY — Instant P2P Payment & Remittance
// Zero-fee real-time transfer between Nordi users
// ============================================================================
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useWallets } from '@nordi/shared/hooks/api-queries/useAccounts';
import { useSendMoneyStore } from '@/stores';

export default function AccessSwiftPay() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const {
    instant: { phone: nordiTag, amount, note },
    setInstantPhone: setNordiTag,
    setInstantAmount: setAmount,
    setInstantNote: setNote,
    resetInstant,
  } = useSendMoneyStore();

  // Transient operation state (not persisted)
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const { data: walletsData } = useWallets();

  const availableBalance = useMemo(() => {
    if (walletsData && Array.isArray(walletsData) && walletsData.length > 0) {
      return Number((walletsData[0] as any)?.balance || 24562.80);
    }
    return 24562.80;
  }, [walletsData]);

  const handleSend = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
    }, 1200);
  };

  if (isDone) {
    return (
      <View style={s.container}>
        <ScreenHeader title="SwiftPay Sent" showBack={false} />
        <View style={s.successBox}>
          <View style={s.successCircle}>
            <Ionicons name="flash" size={48} color="#f59e0b" />
          </View>
          <Text style={s.successTitle}>Payment Sent Instantly!</Text>
          <Text style={s.successSub}>
            ${amount} USD sent to {nordiTag || '@recipient'} with zero fee.
          </Text>

          <Card variant="default" style={s.receiptCard}>
            <CardContent style={s.receiptInner}>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Reference</Text>
                <Text style={s.receiptVal}>SWIFT-{Date.now().toString().slice(-6)}</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Delivery Speed</Text>
                <Text style={s.receiptHighlight}>Instant (Real-time)</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Transaction Fee</Text>
                <Text style={s.receiptFree}>$0.00 (Free)</Text>
              </View>
            </CardContent>
          </Card>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(tabs)/send' as any)}
          >
            Done
          </Button>
        </View>
      </View>
    );
  }

  return (
    <AdaptiveScreen
      withTabBar={false}
      header={
        <ScreenHeader
          title="SwiftPay Instant"
          subtitle="Zero-fee real-time peer-to-peer transfer"
          rightAction={
            <TouchableOpacity
              style={s.qrIconBtn}
              onPress={() => router.push('/(tabs)/scan')}
            >
              <Ionicons name="qr-code-outline" size={20} color={theme.text} />
            </TouchableOpacity>
          }
        />
      }
    >
        {/* Recipient Input Card */}
        <Card variant="default" style={s.cardWrapper}>
          <CardContent style={s.cardInner}>
            <Text style={s.inputLabel}>Recipient NordiTag, Email, or Phone</Text>
            <View style={s.inputRow}>
              <Ionicons name="at-outline" size={20} color={theme.primary} />
              <TextInput
                style={s.tagInput}
                placeholder="norditag, user@domain.com, or +1..."
                placeholderTextColor={theme.textMuted}
                value={nordiTag}
                onChangeText={setNordiTag}
                autoCapitalize="none"
              />
            </View>
          </CardContent>
        </Card>

        {/* Amount Input Card */}
        <Card variant="default" style={s.cardWrapper}>
          <CardContent style={s.cardInner}>
            <View style={s.amountTopRow}>
              <Text style={s.inputLabel}>Transfer Amount</Text>
              <Text style={s.balText}>Available: ${availableBalance.toLocaleString()}</Text>
            </View>

            <View style={s.amountRow}>
              <Text style={s.currencyPrefix}>$</Text>
              <TextInput
                style={s.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.border}
              />
            </View>

            <View style={s.chipRow}>
              {['10', '25', '50', '100', '250', '500'].map(q => (
                <TouchableOpacity
                  key={q}
                  style={[s.chip, amount === q && s.chipActive]}
                  onPress={() => setAmount(q)}
                >
                  <Text style={[s.chipText, amount === q && s.chipTextActive]}>${q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Note / Memo */}
        <Card variant="default" style={s.cardWrapper}>
          <CardContent style={s.cardInner}>
            <Text style={s.inputLabel}>Payment Note (Optional)</Text>
            <TextInput
              style={s.noteInput}
              placeholder="What is this payment for?"
              placeholderTextColor={theme.textMuted}
              value={note}
              onChangeText={setNote}
            />
          </CardContent>
        </Card>

        {/* SwiftPay Features Banner */}
        <View style={s.featuresBanner}>
          <View style={s.featureItem}>
            <Ionicons name="flash-outline" size={16} color="#f59e0b" />
            <Text style={s.featureText}>Instant Settlement</Text>
          </View>
          <View style={s.featureItem}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#16a34a" />
            <Text style={s.featureText}>Zero Transfer Fees</Text>
          </View>
        </View>

        {/* Submit Button */}
        <View style={s.submitWrapper}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isProcessing}
            onPress={handleSend}
            leftIcon={<Ionicons name="flash" size={18} color="#ffffff" />}
          >
            {amount ? `Send $${amount} Instantly` : 'Send Payment'}
          </Button>
        </View>
    </AdaptiveScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    qrIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingBottom: 40,
    },
    cardWrapper: {
      marginHorizontal: 16,
      marginTop: 10,
    },
    cardInner: {
      padding: 16,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.surfaceAlt,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    tagInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      padding: 0,
    },
    amountTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    balText: {
      fontSize: 11,
      color: theme.textMuted,
      fontWeight: '600',
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
    },
    currencyPrefix: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.textMuted,
      marginRight: 6,
    },
    amountInput: {
      flex: 1,
      fontSize: 34,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -1,
      padding: 0,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 10,
    },
    chip: {
      backgroundColor: theme.surfaceAlt,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chipActive: {
      backgroundColor: theme.primarySoft,
      borderColor: theme.primary,
    },
    chipText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.text,
    },
    chipTextActive: {
      color: theme.primary,
    },
    noteInput: {
      backgroundColor: theme.surfaceAlt,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: theme.text,
    },
    featuresBanner: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginHorizontal: 16,
      marginTop: 14,
      padding: 12,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    featureText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.text,
    },
    submitWrapper: {
      marginHorizontal: 16,
      marginTop: 18,
    },
    successBox: {
      flex: 1,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: '#f59e0b',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 6,
    },
    successSub: {
      fontSize: 13,
      color: theme.textMuted,
      textAlign: 'center',
      marginBottom: 20,
    },
    receiptCard: {
      width: '100%',
      marginBottom: 24,
    },
    receiptInner: {
      padding: 16,
      gap: 10,
    },
    receiptRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    receiptLabel: {
      fontSize: 12,
      color: theme.textMuted,
    },
    receiptVal: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
    },
    receiptHighlight: {
      fontSize: 12,
      fontWeight: '700',
      color: '#f59e0b',
    },
    receiptFree: {
      fontSize: 12,
      fontWeight: '700',
      color: '#16a34a',
    },
  });