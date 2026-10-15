// ============================================================================
// CARDS HUB SCREEN — Multi-card management, virtual cards, security & limits
// Connected to shared useClientCards, CreditCardDisplay, and luxury mobile tokens
// ============================================================================
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader, SubNavTabs } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreditCardDisplay, CardStatus } from '@/components/banking/CreditCardDisplay';
import { QuerySection } from '@/components/shared/QuerySection';
import { useClientCards } from '@nordi/shared/client-usecase';
import { useCardsStore } from '@/stores';

const CARD_TABS = [
  { key: 'cards', label: 'My Cards' },
  { key: 'limits', label: 'Spending Controls' },
  { key: 'security', label: 'Card Security' },
];

export default function CardsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const {
    activeTab,
    setActiveTab,
    selectedCardIndex,
    onlinePurchases,
    setOnlinePurchases,
    intlUsage,
    setIntlUsage,
    contactless,
    setContactless,
    atmWithdrawals,
    setAtmWithdrawals,
  } = useCardsStore();

  const { cards: rawCards, isLoading, error, refetch } = useClientCards();

  const cardsList = useMemo(() => {
    if (rawCards && rawCards.length > 0) {
      return rawCards.map((c: any, idx: number) => ({
        id: c.id || c.cardId || String(idx),
        cardNumber: c.cardNumber || '•••• •••• •••• 1234',
        cardholderName: c.cardholderName || 'JOHN DOE',
        expiryDate: c.expiryDate || '12/28',
        cvv: '842',
        brand: (c.cardBrand?.toLowerCase() || 'visa') as any,
        type: (c.cardType?.toLowerCase() || 'virtual') as any,
        status: (c.status?.toLowerCase() || 'active') as CardStatus,
        variant: c.isPhysical ? 'blue' : 'dark' as any,
        balance: c.balance || 4520.00,
        currency: c.currency || 'USD',
      }));
    }

    return [
      {
        id: '1',
        cardNumber: '4532 8921 7843 1234',
        cardholderName: 'JOHN DOE',
        expiryDate: '12/28',
        cvv: '842',
        brand: 'visa' as const,
        type: 'virtual' as const,
        status: 'active' as const,
        variant: 'blue' as const,
        balance: 4520.00,
        currency: 'USD',
      },
      {
        id: '2',
        cardNumber: '5421 9832 1094 5678',
        cardholderName: 'JOHN DOE',
        expiryDate: '09/27',
        cvv: '193',
        brand: 'mastercard' as const,
        type: 'debit' as const,
        status: 'active' as const,
        variant: 'dark' as const,
        balance: 18240.50,
        currency: 'USD',
      },
    ];
  }, [rawCards]);

  const activeCard = cardsList[selectedCardIndex] || cardsList[0];

  const handleToggleFreeze = () => {
    Alert.alert(
      activeCard.status === 'frozen' ? 'Unfreeze Card' : 'Freeze Card',
      `Are you sure you want to ${activeCard.status === 'frozen' ? 'unfreeze' : 'temporarily freeze'} this card?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            activeCard.status = activeCard.status === 'frozen' ? 'active' : 'frozen';
          },
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Cards & Payments"
        subtitle="Virtual & physical card management"
        showBack
        onBackPress={() => router.back()}
        rightElement={
          <TouchableOpacity
            style={s.headerAddBtn}
            onPress={() => router.push('/screens/cards/ApplyForCard' as any)}
          >
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      <SubNavTabs
        tabs={CARD_TABS}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <QuerySection isLoading={isLoading} error={error} onRetry={refetch}>
          {/* CARDS TAB */}
          {activeTab === 'cards' && (
            <>
              {/* Visual Card Display */}
              <View style={s.cardsCarousel}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.carouselTrack}
                >
                  {cardsList.map((card) => (
                    <View key={card.id} style={s.cardSlide}>
                      <CreditCardDisplay
                        cardNumber={card.cardNumber}
                        cardholderName={card.cardholderName}
                        expiryDate={card.expiryDate}
                        cvv={card.cvv}
                        brand={card.brand}
                        type={card.type}
                        status={card.status}
                        variant={card.variant}
                        onFreezeToggle={handleToggleFreeze}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Quick Card Actions */}
              <View style={s.quickActionsRow}>
                <TouchableOpacity style={s.actionTile} onPress={handleToggleFreeze}>
                  <View style={s.actionIconBox}>
                    <Ionicons
                      name={activeCard.status === 'frozen' ? 'lock-open-outline' : 'snow-outline'}
                      size={20}
                      color={activeCard.status === 'frozen' ? theme.colors.success : theme.colors.primary}
                    />
                  </View>
                  <Text style={s.actionLabel}>
                    {activeCard.status === 'frozen' ? 'Unfreeze' : 'Freeze Card'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.actionTile}
                  onPress={() => Alert.alert('Card PIN', 'Your card PIN is: 4891')}
                >
                  <View style={s.actionIconBox}>
                    <Ionicons name="key-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={s.actionLabel}>View PIN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.actionTile}
                  onPress={() => router.push('/screens/cards/CardSecurity' as any)}
                >
                  <View style={s.actionIconBox}>
                    <Ionicons name="shield-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={s.actionLabel}>Security</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.actionTile}
                  onPress={() => router.push('/screens/cards/CardTransactions' as any)}
                >
                  <View style={s.actionIconBox}>
                    <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={s.actionLabel}>History</Text>
                </TouchableOpacity>
              </View>

              {/* Card Information */}
              <Card style={s.metaCard}>
                <CardContent style={s.metaCardInner}>
                  <View style={s.metaRow}>
                    <Text style={s.metaLabel}>Linked Wallet Balance</Text>
                    <Text style={s.metaValBold}>
                      ${Number(activeCard.balance).toLocaleString()} {activeCard.currency}
                    </Text>
                  </View>
                  <View style={s.metaRow}>
                    <Text style={s.metaLabel}>Card Tier</Text>
                    <Badge variant="primary" size="sm">Nordi Platinum</Badge>
                  </View>
                  <View style={s.metaRow}>
                    <Text style={s.metaLabel}>Daily Spending Limit</Text>
                    <Text style={s.metaVal}>$5,000.00 / day</Text>
                  </View>
                  <View style={s.metaRow}>
                    <Text style={s.metaLabel}>Contactless Cap</Text>
                    <Text style={s.metaVal}>$250.00 / transaction</Text>
                  </View>
                </CardContent>
              </Card>

              <View style={s.applyBtnRow}>
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onPress={() => router.push('/screens/cards/VirtualCards' as any)}
                >
                  Manage Virtual Cards
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  style={{ marginTop: 8 }}
                  onPress={() => router.push('/screens/cards/ApplyForCard' as any)}
                >
                  + Apply for New Card
                </Button>
              </View>
            </>
          )}

          {/* LIMITS TAB */}
          {activeTab === 'limits' && (
            <View style={s.tabSection}>
              <Text style={s.sectionTitle}>Spending Limit Thresholds</Text>
              <Text style={s.sectionSub}>Set daily, weekly, and monthly velocity controls on your cards.</Text>

              <Card style={s.metaCard}>
                <CardContent style={s.metaCardInner}>
                  <View style={s.limitItem}>
                    <View style={s.limitTop}>
                      <Text style={s.limitLabel}>Daily Online Purchases</Text>
                      <Text style={s.limitVal}>$2,500.00</Text>
                    </View>
                    <View style={s.progressBarTrack}>
                      <View style={[s.progressBarFill, { width: '45%', backgroundColor: theme.colors.primary }]} />
                    </View>
                  </View>

                  <View style={s.limitItem}>
                    <View style={s.limitTop}>
                      <Text style={s.limitLabel}>Monthly ATM Withdrawals</Text>
                      <Text style={s.limitVal}>$1,000.00</Text>
                    </View>
                    <View style={s.progressBarTrack}>
                      <View style={[s.progressBarFill, { width: '20%', backgroundColor: theme.colors.success }]} />
                    </View>
                  </View>
                </CardContent>
              </Card>
            </View>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <View style={s.tabSection}>
              <Text style={s.sectionTitle}>Channel Controls</Text>
              <Card style={s.metaCard}>
                <CardContent style={s.metaCardInner}>
                  <View style={s.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.toggleTitle}>Online Purchases (E-Commerce)</Text>
                      <Text style={s.toggleSub}>Allow internet payments via CVV</Text>
                    </View>
                    <Switch
                      value={onlinePurchases}
                      onValueChange={setOnlinePurchases}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    />
                  </View>
                  <View style={s.divider} />
                  <View style={s.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.toggleTitle}>International Transactions</Text>
                      <Text style={s.toggleSub}>Allow charges outside your home region</Text>
                    </View>
                    <Switch
                      value={intlUsage}
                      onValueChange={setIntlUsage}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    />
                  </View>
                  <View style={s.divider} />
                  <View style={s.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.toggleTitle}>Contactless (NFC) Tap to Pay</Text>
                      <Text style={s.toggleSub}>Apple Pay & POS Terminal tap</Text>
                    </View>
                    <Switch
                      value={contactless}
                      onValueChange={setContactless}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    />
                  </View>
                  <View style={s.divider} />
                  <View style={s.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.toggleTitle}>ATM Cash Withdrawals</Text>
                      <Text style={s.toggleSub}>Physical cash at automated teller machines</Text>
                    </View>
                    <Switch
                      value={atmWithdrawals}
                      onValueChange={setAtmWithdrawals}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    />
                  </View>
                </CardContent>
              </Card>
            </View>
          )}
        </QuerySection>
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
    headerAddBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    cardsCarousel: {
      marginHorizontal: -16,
      marginBottom: 16,
    },
    carouselTrack: {
      paddingHorizontal: 16,
    },
    cardSlide: {
      marginRight: 12,
    },
    quickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    actionTile: {
      flex: 1,
      alignItems: 'center',
    },
    actionIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: `${theme.colors.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    actionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    metaCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    metaCardInner: {
      padding: 14,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    metaLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    metaVal: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    metaValBold: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    applyBtnRow: {
      marginTop: 4,
    },
    tabSection: {
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    sectionSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    limitItem: {
      paddingVertical: 8,
    },
    limitTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    limitLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    limitVal: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    progressBarTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
    },
    toggleTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    toggleSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 10,
    },
  });
}
