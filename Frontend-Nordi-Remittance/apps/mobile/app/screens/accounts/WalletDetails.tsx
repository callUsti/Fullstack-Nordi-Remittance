// ============================================================================
// WALLET DETAILS SCREEN — IBAN, SWIFT/BIC, Bank Address, & Transaction Ledger
// Connected to useClientWalletDetail, useClientWalletProducts, useUpdateWallet, useCloseWallet
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import {
  useClientWalletDetail,
  useClientWalletProducts,
  useUpdateWallet,
  useCloseWallet,
  formatWalletBalances,
} from '@nordi/shared/client-usecase';
import { ICON_SIZES, SPACING, FONT_SIZES, RADIUS } from '@/constants/sizings';

export default function WalletDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const walletId = params.id as string;
  const initialName = (params.name as string) || 'Primary Wallet';
  const initialCurrency = (params.currency as string) || 'USD';

  const { wallet, limit, recentEntries, isLoading, refetch } = useClientWalletDetail(walletId);
  const { products } = useClientWalletProducts(walletId);

  const updateWalletMutation = useUpdateWallet();
  const closeWalletMutation = useCloseWallet();

  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');

  const displayName = wallet?.notes || initialName;
  const walletNumber = wallet?.walletNumber || 'NR-4421-8890';
  const isPrimary = Boolean(wallet?.isPrimary);
  const primaryCurrency = wallet?.primaryCurrency || initialCurrency;
  const primaryBalance = wallet?.primaryCurrencyBalance ?? 0;

  const bankDetails = [
    { label: 'Account Holder', value: 'Nordi Remit Global Client' },
    { label: 'IBAN / Wallet Account Number', value: walletNumber },
    { label: 'SWIFT / BIC Code', value: 'NORDGB2LXXX' },
    { label: 'Routing / Sort Code', value: '60-16-13' },
    { label: 'Bank Name', value: 'Nordi Remit Banking (Europe) SE' },
    { label: 'Bank Address', value: 'Canary Wharf Financial District, London E14 5HP' },
  ];

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  };

  const handleMakePrimary = () => {
    if (isPrimary) return;
    updateWalletMutation.mutate(
      { walletId, data: { isDefault: true } as any },
      {
        onSuccess: () => {
          refetch();
          Alert.alert('Success', 'This wallet has been set as your primary account.');
        },
      }
    );
  };

  const handleRenameSubmit = () => {
    if (!newWalletName.trim()) return;
    updateWalletMutation.mutate(
      { walletId, data: { notes: newWalletName.trim() } as any },
      {
        onSuccess: () => {
          setRenameModalVisible(false);
          refetch();
          Alert.alert('Success', 'Wallet name updated.');
        },
      }
    );
  };

  const handleCloseWallet = () => {
    if (isPrimary) {
      Alert.alert(
        'Cannot Close Primary Wallet',
        'Please designate another wallet as primary before closing this account.'
      );
      return;
    }

    Alert.alert(
      'Close Currency Pocket',
      `Are you sure you want to close "${displayName}"? Any remaining balances must be zero before closing.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Wallet',
          style: 'destructive',
          onPress: () => {
            closeWalletMutation.mutate(walletId, {
              onSuccess: () => {
                Alert.alert('Wallet Closed', 'Your wallet has been closed.', [
                  { text: 'OK', onPress: () => router.replace('/screens/accounts' as any) },
                ]);
              },
              onError: (err: any) => {
                Alert.alert('Could Not Close Wallet', err?.message || 'Error closing wallet.');
              },
            });
          },
        },
      ]
    );
  };

  return (
    <AdaptiveScreen
      onRefresh={() => { refetch(); }}
      refreshing={isLoading}
      header={
        <ScreenHeader
          title={displayName}
          subtitle="Multi-currency Pocket Coordinates & History"
          showBack
          onBackPress={() => router.back()}
          rightAction={
            <TouchableOpacity
              onPress={() => {
                setNewWalletName(displayName);
                setRenameModalVisible(true);
              }}
              style={s.headerEditBtn}
              activeOpacity={0.7}
            >
              <Icon name="Settings" size={ICON_SIZES.md} color={theme.primary} />
            </TouchableOpacity>
          }
        />
      }
    >
      {/* Balance Hero Card */}
      <Card style={s.balanceHero}>
        <CardContent style={s.heroContent}>
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroLabel}>AVAILABLE BALANCE</Text>
              <Text style={s.heroBalance}>
                {primaryCurrency === 'EUR' ? '€' : primaryCurrency === 'GBP' ? '£' : '$'}
                {primaryBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={s.badgeCol}>
              <Badge variant={wallet?.status === 'active' ? 'success' : 'danger'} size="sm">
                {wallet?.status || 'Active'}
              </Badge>
              {isPrimary && (
                <Badge variant="primary" size="sm" style={{ marginTop: 4 }}>
                  Default
                </Badge>
              )}
            </View>
          </View>

          {/* Sub-balances across currencies if multi-currency */}
          {wallet && wallet.balancesByCurrency.length > 0 && (
            <View style={s.multiBalancesWrap}>
              <Text style={s.multiBalancesLabel}>ALL HOLDINGS</Text>
              <Text style={s.multiBalancesText}>{formatWalletBalances(wallet)}</Text>
            </View>
          )}

          <View style={s.quickActionsRow}>
            <Button
              variant="primary"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: '/screens/send-money' as any,
                  params: { walletId },
                })
              }
              style={{ flex: 1 }}
            >
              Transfer Funds
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: '/screens/accounts/AccountStatements' as any,
                  params: { walletId, name: displayName },
                })
              }
              style={{ flex: 1 }}
            >
              Statement
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* Wire & Banking Coordinates */}
      <Text style={s.sectionTitle}>Local & International Wire Details</Text>
      <Card style={s.bankCard}>
        <CardContent style={s.bankContent}>
          {bankDetails.map((item, index) => (
            <View
              key={item.label}
              style={[s.bankRow, index < bankDetails.length - 1 && s.bankBorder]}
            >
              <View style={s.bankMeta}>
                <Text style={s.bankLabel}>{item.label}</Text>
                <Text style={s.bankValue} selectable>
                  {item.value}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => copyToClipboard(item.value, item.label)}
                style={s.copyBtn}
                accessibilityLabel={`Copy ${item.label}`}
                activeOpacity={0.7}
              >
                <Icon name="Copy" size={ICON_SIZES.sm} color={theme.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </CardContent>
      </Card>

      {/* Linked Cards & Products */}
      <View style={s.sectionHeaderRow}>
        <Text style={s.sectionTitle}>Linked Products & Cards</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/screens/accounts/LinkCardWallet' as any,
              params: { walletId, walletName: displayName },
            })
          }
          activeOpacity={0.7}
        >
          <Text style={s.linkText}>Manage Cards</Text>
        </TouchableOpacity>
      </View>
      <Card style={s.productCard}>
        <CardContent style={s.productContent}>
          <View style={s.productRow}>
            <View style={s.productIconCircle}>
              <Icon name="CreditCard" size={ICON_SIZES.md} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.productTitle}>
                {products.cards.length} Linked Debit Card{products.cards.length === 1 ? '' : 's'}
              </Text>
              <Text style={s.productSub}>Directly linked to this pocket for POS and ATM</Text>
            </View>
            <Button
              variant="outline"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: '/screens/accounts/LinkCardWallet' as any,
                  params: { walletId, walletName: displayName },
                })
              }
            >
              Configure
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* Recent Ledger Entries */}
      <Text style={s.sectionTitle}>Recent Ledger Transactions</Text>
      {recentEntries.length === 0 ? (
        <Card style={s.emptyCard}>
          <CardContent style={s.emptyContent}>
            <Icon name="Receipt" size={ICON_SIZES.xl} color={theme.textMuted} />
            <Text style={s.emptyTitle}>No transactions recorded yet</Text>
            <Text style={s.emptySub}>
              Transfers and settlements into this pocket will appear here in real time.
            </Text>
          </CardContent>
        </Card>
      ) : (
        <Card style={s.ledgerCard}>
          <CardContent style={s.ledgerContent}>
            {recentEntries.slice(0, 8).map((entry, idx) => {
              const isCredit = entry.entryType === 'credit';
              const isLast = idx === Math.min(recentEntries.length, 8) - 1;
              return (
                <View
                  key={entry.id || idx}
                  style={[s.ledgerItem, !isLast && s.ledgerBorder]}
                >
                  <View style={s.ledgerIcon}>
                    <Icon
                      name={isCredit ? 'ArrowDownLeft' : 'ArrowUpRight'}
                      size={ICON_SIZES.sm}
                      color={isCredit ? theme.success : theme.primary}
                    />
                  </View>
                  <View style={s.ledgerMeta}>
                    <Text style={s.ledgerDesc} numberOfLines={1}>
                      {entry.description || 'Transfer'}
                    </Text>
                    <Text style={s.ledgerDate}>
                      {entry.accountingDate
                        ? new Date(entry.accountingDate).toLocaleDateString()
                        : 'Settled'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      s.ledgerAmount,
                      { color: isCredit ? theme.success : theme.text },
                    ]}
                  >
                    {isCredit ? '+' : '-'}${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Wallet Management Controls */}
      <Text style={s.sectionTitle}>Wallet Settings & Actions</Text>
      <Card style={s.settingsCard}>
        <CardContent style={s.settingsContent}>
          {!isPrimary && (
            <TouchableOpacity
              style={s.settingRow}
              onPress={handleMakePrimary}
              activeOpacity={0.7}
            >
              <View style={s.settingIconCircle}>
                <Icon name="ShieldCheck" size={ICON_SIZES.sm} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.settingTitle}>Set as Primary Wallet</Text>
                <Text style={s.settingSub}>Default account for receiving incoming transfers</Text>
              </View>
              <Icon name="ChevronRight" size={ICON_SIZES.sm} color={theme.textMuted} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={s.settingRow}
            onPress={() => {
              setNewWalletName(displayName);
              setRenameModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={s.settingIconCircle}>
              <Icon name="Settings" size={ICON_SIZES.sm} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.settingTitle}>Rename Pocket</Text>
              <Text style={s.settingSub}>Update custom alias / label</Text>
            </View>
            <Icon name="ChevronRight" size={ICON_SIZES.sm} color={theme.textMuted} />
          </TouchableOpacity>

          {!isPrimary && (
            <TouchableOpacity
              style={[s.settingRow, { borderBottomWidth: 0 }]}
              onPress={handleCloseWallet}
              activeOpacity={0.7}
            >
              <View style={[s.settingIconCircle, { backgroundColor: `${theme.danger}15` }]}>
                <Icon name="Lock" size={ICON_SIZES.sm} color={theme.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingTitle, { color: theme.danger }]}>Close Currency Pocket</Text>
                <Text style={s.settingSub}>Deactivate IBAN and archive ledger</Text>
              </View>
              <Icon name="ChevronRight" size={ICON_SIZES.sm} color={theme.danger} />
            </TouchableOpacity>
          )}
        </CardContent>
      </Card>

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <Card style={s.modalCard}>
            <CardContent style={s.modalContent}>
              <Text style={s.modalTitle}>Rename Pocket</Text>
              <Text style={s.modalSub}>Enter a new custom label for this pocket:</Text>
              <TextInput
                style={s.modalInput}
                value={newWalletName}
                onChangeText={setNewWalletName}
                placeholder="e.g. Travel Fund, USD Main"
                placeholderTextColor={theme.textMuted}
                autoFocus
              />
              <View style={s.modalBtnRow}>
                <Button
                  variant="outline"
                  size="md"
                  onPress={() => setRenameModalVisible(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onPress={handleRenameSubmit}
                  isLoading={updateWalletMutation.isPending}
                  style={{ flex: 1 }}
                >
                  Save
                </Button>
              </View>
            </CardContent>
          </Card>
        </View>
      </Modal>
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    headerEditBtn: {
      padding: SPACING.xs,
    },
    balanceHero: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    heroContent: {
      padding: SPACING.lg,
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.md,
    },
    heroLabel: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '700',
      color: theme.textMuted,
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    heroBalance: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.5,
    },
    badgeCol: {
      alignItems: 'flex-end',
    },
    multiBalancesWrap: {
      backgroundColor: theme.background,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      marginBottom: SPACING.md,
    },
    multiBalancesLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.textMuted,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    multiBalancesText: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '600',
      color: theme.text,
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '700',
      color: theme.text,
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
    },
    linkText: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '700',
      color: theme.primary,
    },
    bankCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    bankContent: {
      padding: SPACING.sm,
    },
    bankRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xs,
    },
    bankBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    bankMeta: {
      flex: 1,
      paddingRight: SPACING.sm,
    },
    bankLabel: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      marginBottom: 2,
    },
    bankValue: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '600',
      color: theme.text,
    },
    copyBtn: {
      padding: SPACING.xs,
      borderRadius: RADIUS.xs,
    },
    productCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    productContent: {
      padding: SPACING.md,
    },
    productRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    productIconCircle: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      backgroundColor: `${theme.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    productTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    productSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
    },
    emptyCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: SPACING.lg,
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
    },
    ledgerCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.md,
    },
    ledgerContent: {
      paddingHorizontal: SPACING.md,
    },
    ledgerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
    },
    ledgerBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    ledgerIcon: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.sm,
      backgroundColor: `${theme.primary}10`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.sm,
    },
    ledgerMeta: {
      flex: 1,
    },
    ledgerDesc: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '600',
      color: theme.text,
    },
    ledgerDate: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      marginTop: 2,
    },
    ledgerAmount: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '700',
    },
    settingsCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING['3xl'],
    },
    settingsContent: {
      paddingHorizontal: SPACING.sm,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: SPACING.sm,
    },
    settingIconCircle: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.md,
      backgroundColor: `${theme.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingTitle: {
      fontSize: FONT_SIZES.bodySm,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    settingSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.lg,
    },
    modalCard: {
      width: '100%',
      backgroundColor: theme.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalContent: {
      padding: SPACING.lg,
    },
    modalTitle: {
      fontSize: FONT_SIZES.headline,
      fontWeight: '800',
      color: theme.text,
      marginBottom: SPACING.xs,
    },
    modalSub: {
      fontSize: FONT_SIZES.bodySm,
      color: theme.textMuted,
      marginBottom: SPACING.md,
    },
    modalInput: {
      height: 46,
      backgroundColor: theme.background,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: SPACING.md,
      fontSize: FONT_SIZES.body,
      color: theme.text,
      marginBottom: SPACING.lg,
    },
    modalBtnRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
  });
}
