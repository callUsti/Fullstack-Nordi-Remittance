// ============================================================================
// ACCESS CRYPTO — On-Chain Crypto Remittance & Instant Token Swap
// High-density luxury crypto movement interface
// ============================================================================
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader, SubNavTabs } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import * as Clipboard from 'expo-clipboard';
import { useSendMoneyStore } from '@/stores';

const CRYPTO_TABS = [
  { key: 'send', label: 'Send On-Chain' },
  { key: 'swap', label: 'Instant Swap' },
];

const ASSETS = [
  { symbol: 'USDT', name: 'Tether USD', price: 1.00, balance: 4250.00, icon: 'shield-checkmark', color: '#26a17b' },
  { symbol: 'BTC', name: 'Bitcoin', price: 68450.00, balance: 0.184, icon: 'logo-bitcoin', color: '#f7931a' },
  { symbol: 'ETH', name: 'Ethereum', price: 3520.00, balance: 2.45, icon: 'cube-outline', color: '#627eea' },
  { symbol: 'SOL', name: 'Solana', price: 178.50, balance: 14.20, icon: 'flash-outline', color: '#14f195' },
  { symbol: 'USDC', name: 'USD Coin', price: 1.00, balance: 1200.00, icon: 'card-outline', color: '#2775ca' },
];

const NETWORKS = [
  { name: 'TRON (TRC-20)', fee: 1.50, eta: '~2 mins' },
  { name: 'Ethereum (ERC-20)', fee: 6.80, eta: '~5 mins' },
  { name: 'Solana Network', fee: 0.10, eta: '~30 secs' },
  { name: 'Polygon (POS)', fee: 0.25, eta: '~1 min' },
  { name: 'Bitcoin Native', fee: 4.20, eta: '~20 mins' },
];

export default function AccessCrypto() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [activeTab, setActiveTab] = useState('send');
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);

  // Swap State (complex local objects)
  const [fromAsset, setFromAsset] = useState(ASSETS[0]);
  const [toAsset, setToAsset] = useState(ASSETS[1]);
  const [swapAmount, setSwapAmount] = useState('500');

  // Form fields managed by Zustand store
  const {
    crypto: { walletAddress: targetAddress, amount },
    setCryptoAddress: setTargetAddress,
    setCryptoAmount: setAmount,
  } = useSendMoneyStore();

  // Transient operation state (not persisted)
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const usdValue = (numAmount * selectedAsset.price).toFixed(2);

  const swapReceive = useMemo(() => {
    const fromVal = (parseFloat(swapAmount) || 0) * fromAsset.price;
    return (fromVal / toAsset.price).toFixed(6);
  }, [swapAmount, fromAsset, toAsset]);

  const handlePasteAddress = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setTargetAddress(text.trim());
    } catch {
      // Fallback
    }
  };

  const handleExecute = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
    }, 1200);
  };

  if (isDone) {
    return (
      <View style={s.container}>
        <ScreenHeader title="Transaction Broadcast" showBack={false} />
        <View style={s.successBox}>
          <View style={s.successCircle}>
            <Ionicons name="checkmark-circle" size={54} color="#16a34a" />
          </View>
          <Text style={s.successTitle}>
            {activeTab === 'send' ? 'Crypto Transfer Broadcast!' : 'Tokens Swapped Successfully!'}
          </Text>
          <Text style={s.successSub}>
            {activeTab === 'send'
              ? `${amount} ${selectedAsset.symbol} broadcasted to ${selectedNetwork.name}.`
              : `Swapped ${swapAmount} ${fromAsset.symbol} for ${swapReceive} ${toAsset.symbol}.`}
          </Text>

          <Card variant="default" style={s.receiptCard}>
            <CardContent style={s.receiptInner}>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Tx Hash</Text>
                <Text style={s.receiptHash}>0x{Date.now().toString(16)}...9f8b</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Network Status</Text>
                <Badge variant="success">Confirmed (12 blocks)</Badge>
              </View>
            </CardContent>
          </Card>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(tabs)/send' as any)}
          >
            Back to Dashboard
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Crypto & Assets"
        subtitle="Multi-chain remittance and instant swap"
        rightAction={
          <TouchableOpacity
            style={s.headerBtn}
            onPress={() => router.push('/screens/Homescreens/CryptoListScreen')}
          >
            <Ionicons name="trending-up-outline" size={18} color={theme.text} />
          </TouchableOpacity>
        }
      />

      <SubNavTabs tabs={CRYPTO_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* ── SEND TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'send' ? (
          <>
            {/* Asset Selector */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Select Asset</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.assetScroll}>
              {ASSETS.map(asset => {
                const isSelected = selectedAsset.symbol === asset.symbol;
                return (
                  <TouchableOpacity
                    key={asset.symbol}
                    style={[s.assetChip, isSelected && s.assetChipSelected]}
                    onPress={() => setSelectedAsset(asset)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={asset.icon as any} size={18} color={isSelected ? theme.primary : theme.text} />
                    <View>
                      <Text style={[s.assetSymbol, isSelected && s.assetSymbolSelected]}>{asset.symbol}</Text>
                      <Text style={s.assetBal}>{asset.balance} avail</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Recipient Address */}
            <Card variant="default" style={s.cardWrapper}>
              <CardContent style={s.cardInner}>
                <View style={s.addressTopRow}>
                  <Text style={s.fieldLabel}>Destination Wallet Address</Text>
                  <TouchableOpacity onPress={handlePasteAddress}>
                    <Text style={s.pasteLink}>Paste</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.addressInputRow}>
                  <TextInput
                    style={s.addressInput}
                    placeholder="Enter or paste 0x... / T... address"
                    placeholderTextColor={theme.textMuted}
                    value={targetAddress}
                    onChangeText={setTargetAddress}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={s.scanQrBtn}
                    onPress={() => router.push('/(tabs)/scan')}
                  >
                    <Ionicons name="qr-code-outline" size={18} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>

            {/* Network Selector */}
            <Card variant="default" style={s.cardWrapper}>
              <CardContent style={s.cardInner}>
                <Text style={s.fieldLabel}>Transfer Network</Text>
                <View style={s.networkGrid}>
                  {NETWORKS.map(net => {
                    const isSelected = selectedNetwork.name === net.name;
                    return (
                      <TouchableOpacity
                        key={net.name}
                        style={[s.networkItem, isSelected && s.networkItemSelected]}
                        onPress={() => setSelectedNetwork(net)}
                      >
                        <Text style={[s.networkName, isSelected && s.networkNameSelected]}>{net.name}</Text>
                        <Text style={s.networkMeta}>Est. Fee: ${net.fee} · {net.eta}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </CardContent>
            </Card>

            {/* Amount Input */}
            <Card variant="default" style={s.cardWrapper}>
              <CardContent style={s.cardInner}>
                <View style={s.amountTopRow}>
                  <Text style={s.fieldLabel}>Amount to Send</Text>
                  <Text style={s.availText}>Max: {selectedAsset.balance} {selectedAsset.symbol}</Text>
                </View>
                <View style={s.amountInputRow}>
                  <TextInput
                    style={s.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.border}
                  />
                  <Badge variant="info">{selectedAsset.symbol}</Badge>
                </View>
                <Text style={s.usdEquiv}>≈ ${usdValue} USD</Text>
              </CardContent>
            </Card>

            {/* Action Button */}
            <View style={s.actionWrapper}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isProcessing}
                onPress={handleExecute}
                leftIcon={<Ionicons name="send" size={16} color="#ffffff" />}
              >
                Send {amount || '0'} {selectedAsset.symbol}
              </Button>
            </View>
          </>
        ) : (
          /* ── SWAP TAB ──────────────────────────────────────────────────────── */
          <>
            <Card variant="default" style={s.cardWrapper}>
              <CardContent style={s.cardInner}>
                <Text style={s.fieldLabel}>You Pay</Text>
                <View style={s.swapRow}>
                  <TextInput
                    style={s.swapInput}
                    value={swapAmount}
                    onChangeText={setSwapAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.border}
                  />
                  <View style={s.tokenBadge}>
                    <Text style={s.tokenSymbol}>{fromAsset.symbol}</Text>
                  </View>
                </View>
                <Text style={s.swapBal}>Balance: {fromAsset.balance} {fromAsset.symbol}</Text>

                <View style={s.swapDividerRow}>
                  <View style={s.swapLine} />
                  <TouchableOpacity
                    style={s.swapFlipBtn}
                    onPress={() => {
                      const temp = fromAsset;
                      setFromAsset(toAsset);
                      setToAsset(temp);
                    }}
                  >
                    <Ionicons name="swap-vertical" size={18} color={theme.primary} />
                  </TouchableOpacity>
                  <View style={s.swapLine} />
                </View>

                <Text style={s.fieldLabel}>You Receive (Estimated)</Text>
                <View style={s.swapRow}>
                  <Text style={s.receiveAmountTxt}>{swapReceive}</Text>
                  <View style={s.tokenBadge}>
                    <Text style={s.tokenSymbol}>{toAsset.symbol}</Text>
                  </View>
                </View>
                <Text style={s.swapRate}>
                  1 {fromAsset.symbol} ≈ {(fromAsset.price / toAsset.price).toFixed(6)} {toAsset.symbol}
                </Text>
              </CardContent>
            </Card>

            <View style={s.actionWrapper}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isProcessing}
                onPress={handleExecute}
                leftIcon={<Ionicons name="repeat" size={18} color="#ffffff" />}
              >
                Instant Swap Tokens
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerBtn: {
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
    sectionHeader: {
      paddingHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    assetScroll: {
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 10,
    },
    assetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    assetChipSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primarySoft,
    },
    assetSymbol: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    assetSymbolSelected: {
      color: theme.primary,
    },
    assetBal: {
      fontSize: 10,
      color: theme.textMuted,
      marginTop: 1,
    },
    cardWrapper: {
      marginHorizontal: 16,
      marginTop: 10,
    },
    cardInner: {
      padding: 14,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    addressTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pasteLink: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },
    addressInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceAlt,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    addressInput: {
      flex: 1,
      fontSize: 12,
      color: theme.text,
      padding: 0,
    },
    scanQrBtn: {
      padding: 4,
    },
    networkGrid: {
      gap: 6,
      marginTop: 4,
    },
    networkItem: {
      padding: 10,
      borderRadius: 8,
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },
    networkItemSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primarySoft,
    },
    networkName: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    networkNameSelected: {
      color: theme.primary,
    },
    networkMeta: {
      fontSize: 10,
      color: theme.textMuted,
      marginTop: 2,
    },
    amountTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    availText: {
      fontSize: 11,
      color: theme.textMuted,
    },
    amountInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 4,
    },
    amountInput: {
      flex: 1,
      fontSize: 28,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.5,
      padding: 0,
    },
    usdEquiv: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '500',
    },
    actionWrapper: {
      marginHorizontal: 16,
      marginTop: 16,
    },
    swapRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surfaceAlt,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    swapInput: {
      flex: 1,
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      padding: 0,
    },
    tokenBadge: {
      backgroundColor: theme.surface,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tokenSymbol: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    swapBal: {
      fontSize: 10,
      color: theme.textMuted,
      marginTop: 4,
    },
    swapDividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 12,
      gap: 10,
    },
    swapLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    swapFlipBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    receiveAmountTxt: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
    },
    swapRate: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 6,
    },
    successBox: {
      flex: 1,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successCircle: {
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    successSub: {
      fontSize: 13,
      color: theme.textMuted,
      textAlign: 'center',
      marginBottom: 20,
    },
    receiptCard: {
      width: '100%',
      marginBottom: 20,
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
    receiptHash: {
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      color: theme.text,
    },
  });
