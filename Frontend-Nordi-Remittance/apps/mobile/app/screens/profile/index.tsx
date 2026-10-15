// ============================================================================
// PROFILE HUB — Personal, Documents, Communication, Language
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@nordi/shared/store';

interface MenuItemProps {
  icon: string;
  label: string;
  subtitle: string;
  route: string;
  badgeText?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);
  const { user } = useAuth();

  const menuItems: MenuItemProps[] = [
    {
      icon: 'person-outline',
      label: 'Personal Information',
      subtitle: 'Name, DOB, nationality & KYC status',
      route: '/screens/profile/PersonalInformation',
    },
    {
      icon: 'document-text-outline',
      label: 'Document Center',
      subtitle: 'Upload & manage identity documents',
      route: '/screens/profile/DocumentCenter',
    },
    {
      icon: 'chatbubble-ellipses-outline',
      label: 'Communication Preferences',
      subtitle: 'Email, SMS & push notification settings',
      route: '/screens/profile/Communication',
    },
    {
      icon: 'globe-outline',
      label: 'Language & Region',
      subtitle: 'Currency, language & timezone',
      route: '/screens/profile/LanguageRegion',
    },
    {
      icon: 'create-outline',
      label: 'Edit Profile',
      subtitle: 'Update your personal details',
      route: '/screens/profile/ClientUserEdit',
    },
  ];

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U';

  return (
    <View style={s.container}>
      <ScreenHeader title="My Profile" subtitle="Manage your account details" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Avatar Card */}
        <Card style={s.avatarCard}>
          <CardContent style={s.avatarContent}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={s.avatarInfo}>
              <Text style={s.userName}>
                {user ? `${user.firstName} ${user.lastName}` : 'Nordi User'}
              </Text>
              <Text style={s.userEmail}>{user?.email ?? ''}</Text>
              <Badge variant="success" size="sm" style={s.verifiedBadge}>
                Verified Account
              </Badge>
            </View>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <View style={s.menuGroup}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[s.menuItem, idx === menuItems.length - 1 && s.menuItemLast]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={s.menuIcon}>
                <Ionicons name={item.icon as any} size={20} color={theme.colors.primary} />
              </View>
              <View style={s.menuText}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    avatarCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    avatarContent: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    avatarCircle: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
    avatarInfo: { flex: 1, gap: 4 },
    userName: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
    userEmail: { fontSize: 12, color: theme.colors.textSecondary },
    verifiedBadge: { alignSelf: 'flex-start', marginTop: 4 },
    menuGroup: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 12,
    },
    menuItemLast: { borderBottomWidth: 0 },
    menuIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuText: { flex: 1 },
    menuLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
    menuSubtitle: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  });
}
