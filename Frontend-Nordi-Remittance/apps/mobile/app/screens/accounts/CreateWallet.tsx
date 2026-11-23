// ============================================================================
// CREATE WALLET — Instant Multi-Currency Pocket Creation
// Connects to useCreateWallet (POST /api/accounts/wallets)
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useCreateWallet, SUPPORTED_WALLET_CURRENCIES } from '@nordi/shared/client-usecase';
import { ICON_SIZES, SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  description: string;
}

const CURRENCY_DETAILS: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', description: 'Fedwire & ACH routing' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', description: 'SEPA Instant transfers' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', description: 'Faster Payments & BACS' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', description: 'Interac e-Transfer & EFT' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', description: 'Osko & PayID enabled' },
  NGN: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', description: 'Instant NIBSS settlement' },
  KES: { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', description: 'M-Pesa & PesaLink rails' },
  GHS: { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭', description: 'Ghana Interbank GI-Net' },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', description: 'RTC Real-time clearing' },
};

export default function CreateWalletScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [selectedCurrency, setSelectedCurrency] = useState<string>('EUR');
  const [walletType, setWalletType] = useState<'personal' | 'business'>('personal');
  const [nickname, setNickname] = useState('');

  const createWalletMutation = useCreateWallet();

  const handleCreate = () => {
    createWalletMutation.mutate(
      {
        currency: selectedCurrency as any,
        walletType,
        ...(nickname.trim() ? { name: nickname.trim() } : {}),
      } as any,
      {
        onSuccess: (data: any) => {
          const newWalletId = data?.wallet?._id || data?.wallet?.id;
          Alert.alert(
            'Currency Pocket Created',
            `Your new ${selectedCurrency} ${walletType} pocket is now active with local account details.`,
            [
              {
                text: 'View Pocket',
                onPress: () => {
                  if (newWalletId) {
                    router.replace({
                      pathname: '/screens/accounts/WalletDetails' as any,
                      params: { id: newWalletId, currency: selectedCurrency },
                    });
                  } else {
                    router.replace('/screens/accounts' as any);
                  }
                },
              },
            ]
          );
        },
        onError: (err: any) => {
          Alert.alert('Pocket Creation Failed', err?.message || 'Could not create currency pocket.');
        },
      }
    );
  };

  return (
    <AdaptiveScreen
      keyboardAvoiding
      header={
        <ScreenHeader
          title="Open Currency Pocket"
          subtitle="Instant dedicated IBAN & zero exchange fees on creation"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
      {/* Account Type Selector */}
      <Text style={s.sectionTitle}>Account Type</Text>
      <View style={s.typeRow}>
        <TouchableOpacity
          style={[s.typeCard, walletType === 'personal' && s.typeCardSelected]}
          onPress={() => setWalletType('personal')}
          activeOpacity={0.7}
        >
          <View style={s.typeHeader}>
            <Icon
              name="User"
              size={ICON_SIZES.md}
              color={walletType === 'personal' ? theme.primary : theme.textMuted}
            />
            {walletType === 'personal' && <Badge variant="primary" size="sm">Active</Badge>}
          </View>
          <Text style={[s.typeTitle, walletType === 'personal' && s.typeTitleSelected]}>
            Personal Pocket
          </Text>
          <Text style={s.typeDesc}>For personal remittance, travel, and online purchases.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.typeCard, walletType === 'business' && s.typeCardSelected]}
          onPress={() => setWalletType('business')}
          activeOpacity={0.7}
        >
          <View style={s.typeHeader}>
            <Icon
              name="Building"
              size={ICON_SIZES.md}
              color={walletType === 'business' ? theme.primary : theme.textMuted}
            />
            {walletType === 'business' && <Badge variant="primary" size="sm">Active</Badge>}
          </View>
          <Text style={[s.typeTitle, walletType === 'business' && s.typeTitleSelected]}>
            Business Pocket
          </Text>
          <Text style={s.typeDesc}>For client invoicing, merchant payouts, and trade.</Text>
        </TouchableOpacity>
      </View>

      {/* Currency Selection Grid */}
      <Text style={s.sectionTitle}>Select Currency</Text>
      <View style={s.currencyGrid}>
        {SUPPORTED_WALLET_CURRENCIES.map((code) => {
          const info = CURRENCY_DETAILS[code] || {
            code,
            name: code,
            symbol: code,
            flag: '🌐',
            description: 'Global wallet account',
          };
          const isSelected = selectedCurrency === code;
          return (
            <TouchableOpacity
              key={code}
              style={[s.currencyCard, isSelected && s.currencyCardSelected]}
              onPress={() => setSelectedCurrency(code)}
              activeOpacity={0.7}
            >
              <View style={s.currencyTopRow}>
                <Text style={s.currencyFlag}>{info.flag}</Text>
                <Badge variant={isSelected ? 'primary' : 'neutral'} size="sm">
                  {info.symbol}
                </Badge>
              </View>
              <Text style={[s.currencyCode, isSelected && s.currencyCodeSelected]}>
                {info.code}
              </Text>
              <Text style={s.currencyName} numberOfLines={1}>
                {info.name}
              </Text>
              <Text style={s.currencyDesc} numberOfLines={1}>
                {info.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Pocket Nickname Field */}
      <Card style={s.nicknameCard}>
        <CardContent style={s.nicknameContent}>
          <Text style={s.fieldLabel}>Pocket Nickname (Optional)</Text>
          <TextInput
            style={s.textInput}
            placeholder={`e.g. ${selectedCurrency} Savings or Travel Fund`}
            placeholderTextColor={theme.textMuted}
            value={nickname}
            onChangeText={setNickname}
            maxLength={32}
          />
          <Text style={s.hintText}>
            Give your pocket a custom name to recognize it easily in transfers.
          </Text>
        </CardContent>
      </Card>

      {/* Create Button */}
      <View style={s.btnWrap}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          isLoading={createWalletMutation.isPending}
          onPress={handleCreate}
        >
          Create {selectedCurrency} Pocket Now
        </Button>
      </View>
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    sectionTitle: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '700',
      color: theme.text,
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
    },
    typeRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    typeCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: SPACING.md,
    },
    typeCardSelected: {
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}0D`,
    },
    typeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    typeTitle: {
      fontSize: FONT_SIZES.titleSm,
      fontWeight: '700',
      color: theme.text,
      marginBottom: SPACING.xxs,
    },
    typeTitleSelected: {
      color: theme.primary,
    },
    typeDesc: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      lineHeight: 15,
    },
    currencyGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    currencyCard: {
      width: '31%',
      backgroundColor: theme.surface,
      borderRadius: RADIUS.md,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: SPACING.sm,
    },
    currencyCardSelected: {
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}0D`,
    },
    currencyTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.xs,
    },
    currencyFlag: {
      fontSize: 22,
    },
    currencyCode: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '800',
      color: theme.text,
    },
    currencyCodeSelected: {
      color: theme.primary,
    },
    currencyName: {
      fontSize: FONT_SIZES.nano,
      color: theme.textMuted,
      fontWeight: '600',
      marginTop: 2,
    },
    currencyDesc: {
      fontSize: 8,
      color: theme.textMuted,
      marginTop: 2,
    },
    nicknameCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.lg,
    },
    nicknameContent: {
      padding: SPACING.md,
    },
    fieldLabel: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '700',
      color: theme.text,
      marginBottom: SPACING.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    textInput: {
      height: 44,
      backgroundColor: theme.background,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: SPACING.md,
      fontSize: FONT_SIZES.body,
      color: theme.text,
      marginBottom: SPACING.xs,
    },
    hintText: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
    },
    btnWrap: {
      marginBottom: SPACING['3xl'],
    },
  });
}
