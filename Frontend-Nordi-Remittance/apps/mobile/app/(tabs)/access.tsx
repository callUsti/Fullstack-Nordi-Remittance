// ============================================================================
// ACCESS & SECURITY SCREEN — Nordi Remittance Mobile
// Ultra-minimalist, sleek security center with live score, 2FA, & devices
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { Icon } from '@/components/ui/Icon';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SPACING, FONT_SIZES, ICON_SIZES, RADIUS } from '@/constants/sizings';

interface AccessItem {
  id: string;
  icon: string;
  label: string;
  desc: string;
  enabled: boolean;
  route?: string;
}

interface AccessSection {
  title: string;
  items: AccessItem[];
}

export default function AccessScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const [sections, setSections] = useState<AccessSection[]>([
    {
      title: 'Authentication & Access',
      items: [
        { id: 'bio', icon: 'fingerprint', label: 'Biometric Access', desc: 'Face ID / Fingerprint verification', enabled: true, route: '/screens/security/BiometricAccess' },
        { id: '2fa', icon: 'shield-check', label: 'Two-Factor Authentication', desc: 'Time-based OTP codes on sign-in', enabled: true, route: '/screens/security/TwoFactorAuth' },
        { id: 'applock', icon: 'lock', label: 'App Auto-Lock', desc: 'Require PIN after 2 minutes idle', enabled: true },
      ],
    },
    {
      title: 'Privacy & Visibility',
      items: [
        { id: 'balance', icon: 'eye-off', label: 'Stealth Mode', desc: 'Mask account balances by default', enabled: false },
        { id: 'notify', icon: 'bell', label: 'Security Alerts', desc: 'Real-time suspicious transaction notifications', enabled: true, route: '/screens/security/SecurityAlertsList' },
      ],
    },
    {
      title: 'Device Permissions',
      items: [
        { id: 'cam', icon: 'camera', label: 'Camera Scanner', desc: 'Needed for QR transfers & verification', enabled: true },
        { id: 'loc', icon: 'map-pin', label: 'Location Services', desc: 'Geo-fraud protection during logins', enabled: true },
      ],
    },
  ]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setRefreshing(false);
  };

  const toggleItem = (itemId: string) => {
    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        items: sec.items.map((it) => (it.id === itemId ? { ...it, enabled: !it.enabled } : it)),
      }))
    );
  };

  return (
    <AdaptiveScreen withTabBar={true} onRefresh={onRefresh} refreshing={refreshing}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerSubtitle}>ACCOUNT INTEGRITY</Text>
          <Text style={styles.headerTitle}>Access & Security</Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/screens/security/ActivityLogs')}
          activeOpacity={0.7}
        >
          <Icon name="Clock" size={ICON_SIZES.sm} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Security Score Banner */}
      <Card style={styles.scoreCard}>
        <CardContent style={styles.scoreContent}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreBadgeWrap}>
              <Icon name="ShieldCheck" size={ICON_SIZES.lg} color={theme.success} />
              <View style={styles.scoreTextGroup}>
                <View style={styles.badgeLine}>
                  <Text style={styles.scoreLabel}>Security Rating</Text>
                  <Badge variant="success" size="sm">Optimal 94%</Badge>
                </View>
                <Text style={styles.scoreSubtext}>All critical biometric and 2FA modules are enabled.</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '94%', backgroundColor: theme.success }]} />
          </View>
        </CardContent>
      </Card>

      {/* Access Control Sections */}
      {sections.map((section, idx) => (
        <View key={idx} style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>{section.title.toUpperCase()}</Text>
          <Card style={styles.sectionCard}>
            <CardContent style={{ paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md }}>
              {section.items.map((item, itemIdx) => {
                const isLast = itemIdx === section.items.length - 1;
                return (
                  <View key={item.id} style={[styles.itemRow, !isLast && styles.itemBorder]}>
                    <View style={styles.itemLeft}>
                      <View style={[styles.iconBox, { backgroundColor: item.enabled ? theme.primarySoft : theme.surfaceAlt }]}>
                        <Icon
                          name={item.icon}
                          size={ICON_SIZES.sm}
                          color={item.enabled ? theme.primary : theme.textMuted}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.labelCol}
                        activeOpacity={item.route ? 0.7 : 1}
                        onPress={() => item.route && router.push(item.route as any)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.itemTitle}>{item.label}</Text>
                          {item.route && (
                            <Icon name="ChevronRight" size={ICON_SIZES.nano} color={theme.textMuted} style={{ marginLeft: 4 }} />
                          )}
                        </View>
                        <Text style={styles.itemDesc} numberOfLines={1}>{item.desc}</Text>
                      </TouchableOpacity>
                    </View>
                    <Switch
                      value={item.enabled}
                      onValueChange={() => toggleItem(item.id)}
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor={Platform.OS === 'android' ? (item.enabled ? theme.surface : theme.textMuted) : undefined}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                  </View>
                );
              })}
            </CardContent>
          </Card>
        </View>
      ))}

      {/* Active Device Session */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeading}>ACTIVE HARDWARE SESSION</Text>
        <Card style={styles.deviceCard}>
          <CardContent style={styles.deviceContent}>
            <View style={styles.deviceLeft}>
              <View style={[styles.deviceIconBox, { backgroundColor: theme.primarySoft }]}>
                <Icon name="Smartphone" size={ICON_SIZES.md} color={theme.primary} />
              </View>
              <View style={styles.deviceMeta}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.deviceTitle}>Active Device</Text>
                  <Badge variant="outline" size="sm" style={{ marginLeft: 6 }}>Current</Badge>
                </View>
                <Text style={styles.deviceSub}>London, UK • Authenticated via Touch/FaceID</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.deviceManageBtn}
              onPress={() => router.push('/screens/security/SecuritySettings')}
              activeOpacity={0.7}
            >
              <Icon name="Settings" size={ICON_SIZES.xs} color={theme.textMuted} />
            </TouchableOpacity>
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
    scoreCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.lg,
    },
    scoreContent: {
      padding: SPACING.md,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.sm,
    },
    scoreBadgeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    scoreTextGroup: {
      marginLeft: SPACING.sm,
      flex: 1,
    },
    badgeLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    scoreLabel: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '700',
      color: theme.text,
    },
    scoreSubtext: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
    },
    progressBarTrack: {
      height: 5,
      backgroundColor: theme.surfaceAlt,
      borderRadius: RADIUS.full,
      overflow: 'hidden',
      marginTop: SPACING.xs,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: RADIUS.full,
    },
    sectionWrap: {
      marginBottom: SPACING.lg,
    },
    sectionHeading: {
      fontSize: FONT_SIZES.micro,
      fontWeight: '700',
      letterSpacing: 1,
      color: theme.textMuted,
      marginBottom: SPACING.xs,
      marginLeft: SPACING.xxs,
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.sm,
    },
    itemBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    itemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: SPACING.sm,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.sm,
    },
    labelCol: {
      flex: 1,
    },
    itemTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      color: theme.text,
    },
    itemDesc: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      marginTop: 1,
    },
    deviceCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    deviceContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING.md,
    },
    deviceLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    deviceIconBox: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.sm,
    },
    deviceMeta: {
      flex: 1,
    },
    deviceTitle: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      color: theme.text,
    },
    deviceSub: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      marginTop: 2,
    },
    deviceManageBtn: {
      width: 28,
      height: 28,
      borderRadius: RADIUS.sm,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: SPACING.xs,
    },
  });
