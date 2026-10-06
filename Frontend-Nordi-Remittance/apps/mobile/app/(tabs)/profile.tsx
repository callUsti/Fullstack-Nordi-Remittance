import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

export default function ProfileScreen() {
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const profileSections = [
    {
      title: 'Account Settings',
      items: [
        { icon: 'person', label: 'Personal Information', route: '/profile/personal' },
        { icon: 'shield-checkmark', label: 'Security', route: '/profile/security' },
        { icon: 'notifications', label: 'Notifications', route: '/profile/notifications' },
        { icon: 'language', label: 'Language', route: '/profile/language' }
      ]
    },
    {
      title: 'Banking Preferences',
      items: [
        { icon: 'card', label: 'Payment Methods', route: '/profile/payments' },
        { icon: 'wallet', label: 'Account Limits', route: '/profile/limits' },
        { icon: 'document-text', label: 'Statements', route: '/profile/statements' },
        { icon: 'analytics', label: 'Reports', route: '/profile/reports' }
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle', label: 'Help Center', route: '/profile/help' },
        { icon: 'chatbubble-ellipses', label: 'Contact Us', route: '/profile/contact' },
        { icon: 'document', label: 'Terms & Conditions', route: '/profile/terms' },
        { icon: 'shield', label: 'Privacy Policy', route: '/profile/privacy' }
      ]
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400' }} style={styles.profileImage} />
          <View style={styles.profileText}>
            <Text style={styles.name}>John Doe</Text>
            <Text style={styles.email}>john.doe@example.com</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>4</Text>
          <Text style={styles.statLabel}>Active Accounts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>Active Cards</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>85%</Text>
          <Text style={styles.statLabel}>Profile Complete</Text>
        </View>
      </View>

      {profileSections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity key={itemIndex} style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuItemIcon}>
                    <Ionicons name={item.icon as any} size={20} color={theme.primary} />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.iconMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutButton}>
        <Ionicons name="log-out" size={20} color={theme.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme.surface
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16
  },
  profileText: {
    flex: 1
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text
  },
  email: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    padding: 20,
    marginTop: 1
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary
  },
  statLabel: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: theme.border
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16
  },
  sectionContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    overflow: 'hidden'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  menuItemLabel: {
    fontSize: 16,
    color: theme.text
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 16
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.danger,
    marginLeft: 8
  }
});
