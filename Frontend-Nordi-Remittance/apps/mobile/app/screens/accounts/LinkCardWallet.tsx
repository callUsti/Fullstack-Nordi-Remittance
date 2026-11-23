// ============================================================================
// LINK CARD TO WALLET — Manage Card Links & Funding Sources
// Connects to useClientWalletProducts, useLinkCardToWallet, useUnlinkCardFromWallet, useSetCardFundingSource
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import {
  useClientWalletProducts,
  useLinkCardToWallet,
  useUnlinkCardFromWallet,
  useSetCardFundingSource,
  useClientCards,
} from '@nordi/shared/client-usecase';
import { ICON_SIZES, SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';

export default function LinkCardWalletScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const walletId = params.walletId as string;
  const walletName = (params.walletName as string) || 'Primary Wallet';

  const { products, isLoading, refetch } = useClientWalletProducts(walletId);
  const { cards: allCards } = useClientCards();

  const linkMutation = useLinkCardToWallet();
  const unlinkMutation = useUnlinkCardFromWallet();
  const setFundingMutation = useSetCardFundingSource();

  const linkedCardIds = new Set(products.cards.map((c: any) => c.cardId || c.id || c._id));
  const unlinkedCards = (allCards || []).filter(
    (c: any) => !linkedCardIds.has(c.cardId || c.id || c._id)
  );

  const handleLink = (cardId: string) => {
    linkMutation.mutate(
      { walletId, cardId },
      {
        onSuccess: () => {
          refetch();
          Alert.alert('Card Linked', 'This card can now be funded from this wallet.');
        },
      }
    );
  };

  const handleUnlink = (cardId: string) => {
    Alert.alert(
      'Unlink Card',
      'Are you sure you want to unlink this card from this wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: () => {
            unlinkMutation.mutate(
              { walletId, cardId },
              {
                onSuccess: () => {
                  refetch();
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleSetFundingSource = (cardId: string) => {
    setFundingMutation.mutate(
      { cardId, walletId },
      {
        onSuccess: () => {
          refetch();
          Alert.alert('Primary Funding Source', 'This wallet is now the primary funding source for the card.');
        },
      }
    );
  };

  return (
    <AdaptiveScreen
      onRefresh={() => { refetch(); }}
      refreshing={isLoading}
      header={
        <ScreenHeader
          title="Linked Payment Cards"
          subtitle={`Cards connected to ${walletName}`}
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
      {/* Wallet Target Info */}
      <Card style={s.infoCard}>
        <CardContent style={s.infoContent}>
          <Icon name="Wallet" size={ICON_SIZES.md} color={theme.primary} />
          <View style={s.infoMeta}>
            <Text style={s.infoTitle}>{walletName}</Text>
            <Text style={s.infoSub}>
              Transactions from linked cards deduct from this wallet balance.
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Currently Linked Cards */}
      <Text style={s.sectionTitle}>Currently Linked Cards ({products.cards.length})</Text>
      {products.cards.length === 0 ? (
        <Card style={s.emptyCard}>
          <CardContent style={s.emptyContent}>
            <Icon name="CreditCard" size={ICON_SIZES.xl} color={theme.textMuted} />
            <Text style={s.emptyTitle}>No cards linked to this wallet</Text>
            <Text style={s.emptySub}>
              Link an active debit or virtual card below to fund it directly from this currency pocket.
            </Text>
          </CardContent>
        </Card>
      ) : (
        products.cards.map((c: any) => {
          const cardId = c.cardId || c.id || c._id;
          return (
            <Card key={cardId} style={s.cardItem}>
              <CardContent style={s.cardContent}>
                <View style={s.cardLeft}>
                  <View style={s.cardIconBox}>
                    <Icon name="CreditCard" size={ICON_SIZES.md} color={theme.primary} />
                  </View>
                  <View style={s.cardDetails}>
                    <View style={s.cardTitleRow}>
                      <Text style={s.cardName}>{c.cardholderName || 'Nordi Card'}</Text>
                      <Badge variant="success" size="sm">Active</Badge>
                    </View>
                    <Text style={s.cardNumber}>
                      •••• {c.lastFour || '8492'} · {c.brand || 'Visa'} {c.cardType || 'Debit'}
                    </Text>
                  </View>
                </View>

                <View style={s.actionsRow}>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleSetFundingSource(cardId)}
                    isLoading={setFundingMutation.isPending}
                  >
                    Set as Funding
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onPress={() => handleUnlink(cardId)}
                    isLoading={unlinkMutation.isPending}
                  >
                    Unlink
                  </Button>
                </View>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Available Cards to Link */}
      {unlinkedCards.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Available Cards to Link</Text>
          {unlinkedCards.map((c: any) => {
            const cardId = c.cardId || c.id || c._id;
            return (
              <Card key={cardId} style={s.cardItem}>
                <CardContent style={s.cardContent}>
                  <View style={s.cardLeft}>
                    <View style={s.cardIconBox}>
                      <Icon name="CreditCard" size={ICON_SIZES.md} color={theme.textMuted} />
                    </View>
                    <View style={s.cardDetails}>
                      <Text style={s.cardName}>{c.cardholderName || c.cardName || 'Nordi Card'}</Text>
                      <Text style={s.cardNumber}>
                        •••• {c.lastFour || c.cardNumber?.slice(-4) || '1234'} · {c.cardType || 'Virtual'}
                      </Text>
                    </View>
                  </View>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => handleLink(cardId)}
                    isLoading={linkMutation.isPending}
                  >
                    Link Card
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    infoCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    infoContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      padding: SPACING.md,
    },
    infoMeta: {
      flex: 1,
    },
    infoTitle: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    infoSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      lineHeight: 15,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '700',
      color: theme.text,
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
    },
    emptyCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: SPACING.lg,
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    emptyContent: {
      alignItems: 'center',
      gap: SPACING.xs,
    },
    emptyTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      color: theme.text,
      marginTop: SPACING.xs,
    },
    emptySub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 16,
    },
    cardItem: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.sm,
    },
    cardContent: {
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    cardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    cardIconBox: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      backgroundColor: `${theme.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardDetails: {
      flex: 1,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      marginBottom: 2,
    },
    cardName: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      color: theme.text,
    },
    cardNumber: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: SPACING.sm,
    },
  });
}
