// ============================================================================
// ACCESS INTERNATIONAL — 4-Step Cross-Border Remittance Wizard
// Built with TransferPrimitives, useMobileTheme, and shared domain hooks
// ============================================================================
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StepIndicator, WizardStep } from '@/components/shared/TransferPrimitives';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useWallets, useBeneficiaries } from '@nordi/shared/hooks/api-queries/useAccounts';
import { useSendMoneyStore } from '@/stores';

const WIZARD_STEPS: WizardStep[] = [
  { label: 'Source' },
  { label: 'Recipient' },
  { label: 'Amount & FX' },
  { label: 'Review' },
];

const DESTINATION_CURRENCIES = [
  { code: 'EUR', name: 'Eurozone', flag: '🇪🇺', rate: 0.92, fee: 3.50, symbol: '€' },
  { code: 'GBP', name: 'United Kingdom', flag: '🇬🇧', rate: 0.79, fee: 3.50, symbol: '£' },
  { code: 'CAD', name: 'Canada', flag: '🇨🇦', rate: 1.36, fee: 4.00, symbol: 'C$' },
  { code: 'AUD', name: 'Australia', flag: '🇦🇺', rate: 1.52, fee: 4.00, symbol: 'A$' },
  { code: 'INR', name: 'India', flag: '🇮🇳', rate: 83.25, fee: 2.00, symbol: '₹' },
  { code: 'NGN', name: 'Nigeria', flag: '🇳🇬', rate: 1480.0, fee: 1.50, symbol: '₦' },
];

export default function AccessInternational() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const {
    international: {
      currentStep,
      selectedWalletId,
      recipientName,
      ibanSwift,
      bankName,
      targetCurrencyCode,
      sendAmount,
      deliveryMethod,
      isSuccess,
    },
    setIntlStep,
    setIntlWallet,
    setIntlRecipient,
    setIntlIbanSwift,
    setIntlBankName,
    setIntlTargetCurrency,
    setIntlSendAmount,
    setIntlDeliveryMethod,
    setIntlSuccess,
    resetIntl,
  } = useSendMoneyStore();

  // Resolve the full currency object from the stored code
  const targetCurrency = DESTINATION_CURRENCIES.find(c => c.code === targetCurrencyCode) || DESTINATION_CURRENCIES[0];
  const setTargetCurrency = (curr: typeof DESTINATION_CURRENCIES[0]) => setIntlTargetCurrency(curr.code);
  const setSelectedWalletId = setIntlWallet;
  const setRecipientName = setIntlRecipient;
  const setIbanSwift = setIntlIbanSwift;
  const setBankName = setIntlBankName;
  const setSendAmount = setIntlSendAmount;
  const setDeliveryMethod = setIntlDeliveryMethod as (m: 'swift' | 'local') => void;

  const { data: walletsData } = useWallets();
  const { data: beneficiariesData } = useBeneficiaries();

  const wallets = useMemo(() => {
    const list = Array.isArray(walletsData) ? walletsData : (walletsData as any)?.data || [];
    if (list.length > 0) return list;
    return [
      { id: 'w1', name: 'USD Main Wallet', balance: 24562.80, currency: 'USD', accountNumber: '•••• 1234' },
      { id: 'w2', name: 'EUR Global Account', balance: 8420.15, currency: 'EUR', accountNumber: '•••• 5678' },
    ];
  }, [walletsData]);

  const activeWallet = useMemo(() => {
    return wallets.find((w: any) => w.id === selectedWalletId) || wallets[0];
  }, [wallets, selectedWalletId]);

  const numAmount = parseFloat(sendAmount) || 0;
  const receiveAmount = (numAmount * targetCurrency.rate).toFixed(2);
  const fee = deliveryMethod === 'swift' ? targetCurrency.fee + 12 : targetCurrency.fee;
  const totalDeducted = (numAmount + fee).toFixed(2);

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setIntlStep(currentStep + 1);
    } else {
      setIntlSuccess(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIntlStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  if (isSuccess) {
    return (
      <View style={s.container}>
        <ScreenHeader title="Transfer Status" showBack={false} />
        <View style={s.successBox}>
          <View style={s.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color="#16a34a" />
          </View>
          <Text style={s.successTitle}>Transfer Initiated!</Text>
          <Text style={s.successSub}>
            Your wire of ${sendAmount} USD to {recipientName || 'Recipient'} ({targetCurrency.code}) is being processed.
          </Text>

          <Card variant="default" style={s.receiptCard}>
            <CardContent style={s.receiptInner}>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Transaction ID</Text>
                <Text style={s.receiptVal}>WIRE-{Math.floor(100000 + Math.random() * 900000)}</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Estimated Arrival</Text>
                <Text style={s.receiptVal}>
                  {deliveryMethod === 'swift' ? '1–2 Business Days' : 'Within 30 Minutes'}
                </Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Recipient Gets</Text>
                <Text style={s.receiptValHighlight}>
                  {targetCurrency.symbol}{receiveAmount} {targetCurrency.code}
                </Text>
              </View>
            </CardContent>
          </Card>

          <View style={s.btnRow}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => router.replace('/(tabs)/send' as any)}
            >
              Back to Send & Pay
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <AdaptiveScreen
      withTabBar={false}
      header={
        <View>
          <ScreenHeader
            title="International Wire"
            subtitle="Global remittance & SWIFT transfer"
            onBack={handleBack}
          />
          <View style={s.stepWrapper}>
            <StepIndicator steps={WIZARD_STEPS} current={currentStep} />
          </View>
        </View>
      }
    >
        {/* STEP 0: SOURCE ACCOUNT */}
        {currentStep === 0 && (
          <View style={s.stepContent}>
            <Text style={s.stepHeading}>Select Funding Wallet</Text>
            <Text style={s.stepDesc}>Choose the balance you wish to debit for this cross-border transfer.</Text>

            <View style={s.walletList}>
              {wallets.map((w: any) => {
                const isSelected = (selectedWalletId || wallets[0]?.id) === w.id;
                return (
                  <TouchableOpacity
                    key={w.id}
                    style={[s.walletOption, isSelected && s.walletOptionSelected]}
                    onPress={() => setSelectedWalletId(w.id)}
                    activeOpacity={0.8}
                  >
                    <View style={s.walletIconBox}>
                      <Ionicons name="wallet-outline" size={20} color={isSelected ? theme.primary : theme.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.walletName}>{w.name || 'Nordi Wallet'}</Text>
                      <Text style={s.walletAccount}>{w.accountNumber || 'Primary'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.walletBalance}>${Number(w.balance || 0).toLocaleString()}</Text>
                      <Badge variant="info">{w.currency || 'USD'}</Badge>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 1: RECIPIENT */}
        {currentStep === 1 && (
          <View style={s.stepContent}>
            <Text style={s.stepHeading}>Recipient & Destination</Text>
            <Text style={s.stepDesc}>Enter beneficiary international banking credentials.</Text>

            <Text style={s.fieldLabel}>Destination Currency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.currencyPillRow}>
              {DESTINATION_CURRENCIES.map(curr => {
                const isSelected = targetCurrency.code === curr.code;
                return (
                  <TouchableOpacity
                    key={curr.code}
                    style={[s.currencyPill, isSelected && s.currencyPillSelected]}
                    onPress={() => setTargetCurrency(curr)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.flagText}>{curr.flag}</Text>
                    <Text style={[s.currencyCode, isSelected && s.currencyCodeSelected]}>{curr.code}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={s.formGroup}>
              <Text style={s.fieldLabel}>Recipient Legal Name</Text>
              <TextInput
                style={s.formInput}
                placeholder="e.g. Jean Dupont"
                placeholderTextColor={theme.textMuted}
                value={recipientName}
                onChangeText={setRecipientName}
              />
            </View>

            <View style={s.formGroup}>
              <Text style={s.fieldLabel}>IBAN or Account Number</Text>
              <TextInput
                style={s.formInput}
                placeholder="e.g. FR76 3000 6000 0112 3456 7890 189"
                placeholderTextColor={theme.textMuted}
                value={ibanSwift}
                onChangeText={setIbanSwift}
                autoCapitalize="characters"
              />
            </View>

            <View style={s.formGroup}>
              <Text style={s.fieldLabel}>SWIFT / BIC / Bank Name</Text>
              <TextInput
                style={s.formInput}
                placeholder="e.g. BNPPAFPPAXXX / BNP Paribas"
                placeholderTextColor={theme.textMuted}
                value={bankName}
                onChangeText={setBankName}
                autoCapitalize="characters"
              />
            </View>
          </View>
        )}

        {/* STEP 2: AMOUNT & FX */}
        {currentStep === 2 && (
          <View style={s.stepContent}>
            <Text style={s.stepHeading}>Transfer Amount</Text>
            <Text style={s.stepDesc}>Real-time exchange quote guaranteed for 15 minutes.</Text>

            <Card variant="default" style={s.fxCard}>
              <CardContent style={s.fxCardInner}>
                <Text style={s.fxLabel}>You Send (USD)</Text>
                <View style={s.amountInputRow}>
                  <Text style={s.fxCurrencySymbol}>$</Text>
                  <TextInput
                    style={s.fxAmountInput}
                    value={sendAmount}
                    onChangeText={setSendAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.border}
                  />
                </View>
                <View style={s.fxRateBanner}>
                  <Ionicons name="swap-horizontal" size={14} color={theme.primary} />
                  <Text style={s.fxRateText}>
                    1 USD = {targetCurrency.rate} {targetCurrency.code}
                  </Text>
                </View>

                <View style={s.divider} />

                <Text style={s.fxLabel}>Recipient Receives ({targetCurrency.code})</Text>
                <Text style={s.receiveValue}>
                  {targetCurrency.symbol}{receiveAmount} {targetCurrency.code}
                </Text>
              </CardContent>
            </Card>

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Delivery Channel</Text>
            <View style={s.deliveryRow}>
              <TouchableOpacity
                style={[s.deliveryOption, deliveryMethod === 'local' && s.deliveryOptionSelected]}
                onPress={() => setDeliveryMethod('local')}
              >
                <Ionicons name="flash-outline" size={18} color={deliveryMethod === 'local' ? theme.primary : theme.text} />
                <View style={{ flex: 1 }}>
                  <Text style={s.deliveryTitle}>Local Clearing</Text>
                  <Text style={s.deliveryDesc}>Within 30 mins · Low fee (${targetCurrency.fee})</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.deliveryOption, deliveryMethod === 'swift' && s.deliveryOptionSelected]}
                onPress={() => setDeliveryMethod('swift')}
              >
                <Ionicons name="globe-outline" size={18} color={deliveryMethod === 'swift' ? theme.primary : theme.text} />
                <View style={{ flex: 1 }}>
                  <Text style={s.deliveryTitle}>SWIFT Wire</Text>
                  <Text style={s.deliveryDesc}>1–2 business days · High amount</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: REVIEW */}
        {currentStep === 3 && (
          <View style={s.stepContent}>
            <Text style={s.stepHeading}>Review Details</Text>
            <Text style={s.stepDesc}>Verify all parameters before signing this transaction.</Text>

            <Card variant="default" style={s.reviewCard}>
              <CardContent style={s.reviewInner}>
                <View style={s.reviewRow}>
                  <Text style={s.reviewLabel}>From</Text>
                  <Text style={s.reviewVal}>{activeWallet?.name} ({activeWallet?.currency})</Text>
                </View>
                <View style={s.reviewRow}>
                  <Text style={s.reviewLabel}>To Recipient</Text>
                  <Text style={s.reviewVal}>{recipientName || 'International Beneficiary'}</Text>
                </View>
                <View style={s.reviewRow}>
                  <Text style={s.reviewLabel}>IBAN / Account</Text>
                  <Text style={s.reviewVal}>{ibanSwift || '•••• ••••'}</Text>
                </View>
                <View style={s.reviewRow}>
                  <Text style={s.reviewLabel}>Send Amount</Text>
                  <Text style={s.reviewVal}>${sendAmount} USD</Text>
                </View>
                <View style={s.reviewRow}>
                  <Text style={s.reviewLabel}>FX Rate</Text>
                  <Text style={s.reviewVal}>1 USD = {targetCurrency.rate} {targetCurrency.code}</Text>
                </View>
                <View style={s.reviewRow}>
                  <Text style={s.reviewLabel}>Network Fee</Text>
                  <Text style={s.reviewVal}>${fee.toFixed(2)} USD</Text>
                </View>
                <View style={[s.reviewRow, s.reviewRowHighlight]}>
                  <Text style={s.reviewLabelBold}>Total Deducted</Text>
                  <Text style={s.reviewValBold}>${totalDeducted} USD</Text>
                </View>
                <View style={[s.reviewRow, s.reviewRowFinal]}>
                  <Text style={s.reviewLabelBold}>Beneficiary Gets</Text>
                  <Text style={s.receiveHighlight}>
                    {targetCurrency.symbol}{receiveAmount} {targetCurrency.code}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Action Controls */}
        <View style={[s.footerNav, { marginTop: 16, marginBottom: 24 }]}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleNext}
          >
            {currentStep === WIZARD_STEPS.length - 1 ? 'Authorize Wire Transfer' : 'Next Step'}
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
    stepWrapper: {
      paddingVertical: 10,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderColor: theme.border,
    },
    scrollContent: {
      paddingBottom: 110,
    },
    stepContent: {
      padding: 16,
    },
    stepHeading: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.3,
    },
    stepDesc: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
      marginBottom: 16,
    },
    walletList: {
      gap: 10,
    },
    walletOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    walletOptionSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primarySoft,
    },
    walletIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    walletName: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    walletAccount: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    walletBalance: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 2,
    },
    currencyPillRow: {
      gap: 8,
      marginBottom: 16,
    },
    currencyPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    currencyPillSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primarySoft,
    },
    flagText: {
      fontSize: 16,
    },
    currencyCode: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    currencyCodeSelected: {
      color: theme.primary,
    },
    formGroup: {
      marginBottom: 14,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    formInput: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: theme.text,
    },
    fxCard: {
      marginBottom: 10,
    },
    fxCardInner: {
      padding: 16,
    },
    fxLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
    },
    amountInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
    },
    fxCurrencySymbol: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.textMuted,
      marginRight: 6,
    },
    fxAmountInput: {
      flex: 1,
      fontSize: 32,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -1,
      padding: 0,
    },
    fxRateBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginTop: 6,
    },
    fxRateText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.primary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 14,
    },
    receiveValue: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.text,
      marginTop: 4,
    },
    deliveryRow: {
      gap: 10,
    },
    deliveryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    deliveryOptionSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primarySoft,
    },
    deliveryTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    deliveryDesc: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    reviewCard: {
      marginBottom: 10,
    },
    reviewInner: {
      padding: 16,
      gap: 10,
    },
    reviewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    reviewRowHighlight: {
      paddingTop: 10,
      borderTopWidth: 1,
      borderColor: theme.border,
    },
    reviewRowFinal: {
      paddingTop: 4,
    },
    reviewLabel: {
      fontSize: 12,
      color: theme.textMuted,
    },
    reviewVal: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
    },
    reviewLabelBold: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    reviewValBold: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    receiveHighlight: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.primary,
    },
    footerNav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderColor: theme.border,
    },
    successBox: {
      flex: 1,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successIcon: {
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.5,
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
    receiptValHighlight: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.primary,
    },
    btnRow: {
      width: '100%',
    },
  });