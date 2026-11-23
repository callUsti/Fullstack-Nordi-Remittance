// ============================================================================
// PROFILE & ACCOUNT SETTINGS SCREEN — Nordi Remittance Mobile
// Ultra-minimalist member profile, tier identity, limits, statements & preferences
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { Icon } from '@/components/ui/Icon';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@nordi/shared/store/auth.store';
import { SPACING, FONT_SIZES, ICON_SIZES, RADIUS } from '@/constants/sizings';

interface MenuOption {
  icon: string;
  label: string;
  desc?: string;
  route: string;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuOption[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);
  const user = useAuthStore((state) => state.user);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your Nordi account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          useAuthStore.getState().logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuSections: MenuSection[] = [
    {
      title: 'IDENTITY & ACCOUNT',
      items: [
        { icon: 'User', label: 'Personal Information', desc: 'Legal name, contact & tax info', route: '/screens/profile/PersonalInformation' },
        { icon: 'FileCheck', label: 'Document Center', desc: 'Passport, ID & KYC status', route: '/screens/profile/DocumentCenter', badge: 'Tier 2' },
        { icon: 'ShieldCheck', label: 'Security & 2FA', desc: 'Biometrics, PIN & passkeys', route: '/(tabs)/access' },
        { icon: 'Globe', label: 'Language & Region', desc: 'English (US) • USD ($)', route: '/screens/profile/LanguageRegion' },
      ],
    },
    {
      title: 'BANKING PREFERENCES',
      items: [
        { icon: 'CreditCard', label: 'Payment Methods & Cards', desc: 'Manage virtual & debit cards', route: '/screens/cards/index' },
        { icon: 'Sliders', label: 'Account Limits', desc: 'Daily transfer & ATM quotas', route: '/screens/accounts/AccountLimits' },
        { icon: 'FileText', label: 'Statements & Tax Reports', desc: 'Official stamped PDF exports', route: '/screens/accounts/AccountStatements' },
        { icon: 'Bell', label: 'Notification Settings', desc: 'Push, SMS & email preferences', route: '/screens/profile/Communication' },
      ],
    },
    {
      title: 'LEGAL & CONCIERGE',
      items: [
        { icon: 'HelpCircle', label: 'Concierge & AI Support', desc: '24/7 priority live assistance', route: '/(auth)/contact' },
        { icon: 'FileCode', label: 'Terms of Service', route: '/(auth)/terms-and-services' },
        { icon: 'Shield', label: 'Privacy Policy', route: '/(auth)/privacy-policy' },
      ],
    },
  ];

  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Verified Member' : 'Nordi Member';
  const email = user?.email || 'member@nordi-remit.com';

  return (
    <AdaptiveScreen withTabBar={true} onRefresh={onRefresh} refreshing={refreshing}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerSubtitle}>MEMBER PROFILE</Text>
          <Text style={styles.headerTitle}>Account Settings</Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/screens/profile/PersonalInformation')}
          activeOpacity={0.7}
        >
          <Icon name="Edit3" size={ICON_SIZES.sm} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Member Hero Card */}
      <Card style={styles.heroCard}>
        <CardContent style={styles.heroContent}>
          <View style={styles.heroRow}>
            <Avatar name={fullName} size="lg" />
            <View style={styles.heroMeta}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.heroName}>{fullName}</Text>
                <Badge variant="success" size="sm" style={{ marginLeft: 6 }}>Verified</Badge>
              </View>
              <Text style={styles.heroEmail} numberOfLines={1}>{email}</Text>
              <Text style={styles.heroId}>Nordi ID: NR-{user?.id?.slice(0, 8) || '84920412'}</Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.statsStrip}>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>3</Text>
              <Text style={styles.statLbl}>Wallets</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statVal}>2</Text>
              <Text style={styles.statLbl}>Active Cards</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statVal}>Tier 2</Text>
              <Text style={styles.statLbl}>Verification</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Grouped Settings Sections */}
      {menuSections.map((sec, secIdx) => (
        <View key={secIdx} style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>{sec.title}</Text>
          <Card style={styles.sectionCard}>
            <CardContent style={{ paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md }}>
              {sec.items.map((item, itemIdx) => {
                const isLast = itemIdx === sec.items.length - 1;
                return (
                  <TouchableOpacity
                    key={itemIdx}
                    style={[styles.itemRow, !isLast && styles.itemBorder]}
                    onPress={() => item.route && router.push(item.route as any)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemLeft}>
                      <View style={[styles.iconBox, { backgroundColor: theme.surfaceAlt }]}>
                        <Icon name={item.icon} size={ICON_SIZES.sm} color={theme.primary} />
                      </View>
                      <View style={styles.itemTextCol}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.itemTitle}>{item.label}</Text>
                          {item.badge && (
                            <Badge variant="secondary" size="sm" style={{ marginLeft: 6 }}>
                              {item.badge}
                            </Badge>
                          )}
                        </View>
                        {item.desc && <Text style={styles.itemDesc} numberOfLines={1}>{item.desc}</Text>}
                      </View>
                    </View>
                    <Icon name="ChevronRight" size={ICON_SIZES.xs} color={theme.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </CardContent>
          </Card>
        </View>
      ))}

      {/* Log Out Button */}
      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Icon name="LogOut" size={ICON_SIZES.sm} color={theme.danger} />
        <Text style={[styles.logoutText, { color: theme.danger }]}>Sign Out of Nordi</Text>
      </TouchableOpacity>

      <Text style={styles.buildVersion}>Nordi Remittance Mobile v1.0.0 (Build 57)</Text>
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
    heroCard: {
      backgroundColor: theme.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: SPACING.lg,
    },
    heroContent: {
      padding: SPACING.md,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    heroMeta: {
      marginLeft: SPACING.md,
      flex: 1,
    },
    heroName: {
      fontSize: FONT_SIZES.titleSm,
      fontWeight: '700',
      color: theme.text,
    },
    heroEmail: {
      fontSize: FONT_SIZES.caption,
      color: theme.textMuted,
      marginTop: 1,
    },
    heroId: {
      fontSize: FONT_SIZES.nano,
      color: theme.textMuted,
      marginTop: 2,
    },
    statsStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surfaceAlt,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.xs + 2,
      paddingHorizontal: SPACING.md,
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
    },
    statVal: {
      fontSize: FONT_SIZES.subhead,
      fontWeight: '700',
      color: theme.text,
    },
    statLbl: {
      fontSize: FONT_SIZES.nano,
      color: theme.textMuted,
      marginTop: 1,
    },
    statDivider: {
      width: 1,
      height: 18,
      backgroundColor: theme.border,
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
    itemTextCol: {
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
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.sm + 2,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      marginBottom: SPACING.sm,
    },
    logoutText: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      marginLeft: SPACING.xs,
    },
    buildVersion: {
      textAlign: 'center',
      fontSize: FONT_SIZES.nano,
      color: theme.textMuted,
      marginBottom: SPACING.md,
    },
  });
