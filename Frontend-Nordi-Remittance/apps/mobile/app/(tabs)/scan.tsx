// ============================================================================
// SCAN & PAY SCREEN — Nordi Remittance Mobile
// Ultra-clean, modern QR payment scanner & merchant reader
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { Icon } from '@/components/ui/Icon';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SPACING, FONT_SIZES, ICON_SIZES, RADIUS } from '@/constants/sizings';

export default function ScanScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const [flashlight, setFlashlight] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setRefreshing(false);
  };

  const recentScans = [
    { id: '1', name: 'Blue Bottle Cafe', amount: 6.25, time: '20m ago', category: 'Dining', currency: 'USD' },
    { id: '2', name: 'Whole Foods Market', amount: 54.80, time: 'Yesterday', category: 'Groceries', currency: 'USD' },
    { id: '3', name: 'Nordi ATM London', amount: 120.00, time: 'Oct 18', category: 'Cash Out', currency: 'GBP' },
  ];

  return (
    <AdaptiveScreen withTabBar={true} onRefresh={onRefresh} refreshing={refreshing}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerSubtitle}>CONTACTLESS PAY</Text>
          <Text style={styles.headerTitle}>Scan to Pay</Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/screens/Transactions' as any)}
          activeOpacity={0.7}
        >
          <Icon name="Clock" size={ICON_SIZES.sm} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Modern Viewfinder Box */}
      <Card style={styles.viewfinderCard}>
        <CardContent style={styles.viewfinderContent}>
          <View style={styles.frameWrapper}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: theme.primary }]} />

            {/* Center target indicator */}
            <View style={styles.laserLineWrap}>
              <View style={[styles.laserLine, { backgroundColor: theme.primary }]} />
            </View>

            <View style={styles.centerAim}>
              <Icon name="QrCode" size={32} color={`${theme.primary}40`} />
            </View>
          </View>

          <Text style={styles.instructionsText}>
            Align payment QR code or invoice barcode inside the square
          </Text>

          {/* Quick controls row inside card */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[
                styles.controlBtn,
                flashlight && { backgroundColor: theme.primarySoft, borderColor: theme.primary },
              ]}
              onPress={() => setFlashlight(!flashlight)}
              activeOpacity={0.7}
            >
              <Icon
                name={flashlight ? 'Zap' : 'ZapOff'}
                size={ICON_SIZES.sm}
                color={flashlight ? theme.primary : theme.textMuted}
              />
              <Text style={[styles.controlText, flashlight && { color: theme.primary }]}>
                {flashlight ? 'Torch On' : 'Torch Off'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => Alert.alert('My QR', 'Your Nordi Pay ID: @nordi.member')}
              activeOpacity={0.7}
            >
              <Icon name="Share2" size={ICON_SIZES.sm} color={theme.textMuted} />
              <Text style={styles.controlText}>My Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => Alert.alert('Upload', 'Select QR screenshot from camera roll.')}
              activeOpacity={0.7}
            >
              <Icon name="Image" size={ICON_SIZES.sm} color={theme.textMuted} />
              <Text style={styles.controlText}>Upload</Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>

      {/* Recent QR Transactions */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>RECENT MERCHANT PAYMENTS</Text>
          <TouchableOpacity
            onPress={() => router.push('/screens/banking/transactions')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.recentCard}>
          <CardContent style={{ paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md }}>
            {recentScans.map((scan, idx) => {
              const isLast = idx === recentScans.length - 1;
              return (
                <View key={scan.id} style={[styles.scanRow, !isLast && styles.scanBorder]}>
                  <View style={styles.scanLeft}>
                    <View style={[styles.scanIconWrap, { backgroundColor: theme.primarySoft }]}>
                      <Icon name="Store" size={ICON_SIZES.sm} color={theme.primary} />
                    </View>
                    <View style={styles.scanTextCol}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.scanName}>{scan.name}</Text>
                        <Badge variant="outline" size="sm" style={{ marginLeft: 6 }}>
                          {scan.category}
                        </Badge>
                      </View>
                      <Text style={styles.scanTime}>{scan.time} • Instant settlement</Text>
                    </View>
                  </View>
                  <Text style={styles.scanAmount}>
                    -${scan.amount.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </CardContent>
        </Card>
      </View>
    </AdaptiveScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    topHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.lg,
      marginTop: SPACING.xs,
    },
    headerSubtitle: {
      fontSize: FONT_SIZES.nano,
      letterSpacing: 1.2,
      fontWeight: '700',
      color: theme.primary,
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: FONT_SIZES.hero,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.5,
    },
    headerBtn: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewfinderCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.lg,
    },
    viewfinderContent: {
      alignItems: 'center',
      paddingVertical: SPACING.xl,
      paddingHorizontal: SPACING.md,
    },
    frameWrapper: {
      width: 200,
      height: 200,
      borderRadius: RADIUS.lg,
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    corner: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderWidth: 3,
    },
    cornerTL: {
      top: 0,
      left: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderTopLeftRadius: RADIUS.md,
    },
    cornerTR: {
      top: 0,
      right: 0,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
      borderTopRightRadius: RADIUS.md,
    },
    cornerBL: {
      bottom: 0,
      left: 0,
      borderRightWidth: 0,
      borderTopWidth: 0,
      borderBottomLeftRadius: RADIUS.md,
    },
    cornerBR: {
      bottom: 0,
      right: 0,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      borderBottomRightRadius: RADIUS.md,
    },
    centerAim: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    laserLineWrap: {
      position: 'absolute',
      top: '48%',
      width: '100%',
      paddingHorizontal: 8,
    },
    laserLine: {
      height: 2,
      borderRadius: 1,
    },
    instructionsText: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      marginTop: SPACING.md,
      textAlign: 'center',
      paddingHorizontal: SPACING.md,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.lg,
      gap: SPACING.sm,
    },
    controlBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.xs + 2,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.full,
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },
    controlText: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '600',
      color: theme.textMuted,
      marginLeft: 6,
    },
    sectionWrap: {
      marginBottom: SPACING.lg,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.xs,
      paddingHorizontal: SPACING.xxs,
    },
    sectionHeading: {
      fontSize: FONT_SIZES.micro,
      fontWeight: '700',
      letterSpacing: 1,
      color: theme.textMuted,
    },
    seeAllText: {
      fontSize: FONT_SIZES.caption,
      fontWeight: '600',
      color: theme.primary,
    },
    recentCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    scanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.sm,
    },
    scanBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    scanLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: SPACING.sm,
    },
    scanIconWrap: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.sm,
    },
    scanTextCol: {
      flex: 1,
    },
    scanName: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      color: theme.text,
    },
    scanTime: {
      fontSize: FONT_SIZES.nano,
      color: theme.textMuted,
      marginTop: 2,
    },
    scanAmount: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      color: theme.text,
    },
  });
