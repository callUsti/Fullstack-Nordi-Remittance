import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

export default function AccessScreen() {
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const accessItems = [
    {
      title: 'Quick Access',
      items: [
        { icon: 'finger-print', label: 'Biometric Login', enabled: true },
        { icon: 'phone-portrait', label: 'Device Management', enabled: true },
        { icon: 'key', label: 'Password Manager', enabled: false }
      ]
    },
    {
      title: 'Security',
      items: [
        { icon: 'shield-checkmark', label: '2-Factor Authentication', enabled: true },
        { icon: 'lock-closed', label: 'App Lock', enabled: true },
        { icon: 'eye-off', label: 'Hide Balance', enabled: false }
      ]
    },
    {
      title: 'Permissions',
      items: [
        { icon: 'camera', label: 'Camera Access', enabled: true },
        { icon: 'location', label: 'Location Services', enabled: true },
        { icon: 'notifications', label: 'Push Notifications', enabled: true }
      ]
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Access</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.securityScore}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Security Score</Text>
          <Text style={styles.scoreValue}>85%</Text>
        </View>
        <View style={styles.scoreBar}>
          <View style={[styles.scoreProgress, { width: '85%' }]} />
        </View>
        <Text style={styles.scoreText}>Your account security is good</Text>
      </View>

      {accessItems.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity key={itemIndex} style={styles.accessItem}>
                <View style={styles.accessItemLeft}>
                  <View style={[styles.accessItemIcon, { backgroundColor: item.enabled ? theme.primarySoft : theme.surfaceAlt }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.enabled ? theme.primary : theme.iconMuted} />
                  </View>
                  <Text style={[styles.accessItemLabel, { color: item.enabled ? theme.text : theme.textMuted }]}>{item.label}</Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: item.enabled ? theme.primary : theme.border }]}>
                  <View style={[styles.toggleKnob, { transform: [{ translateX: item.enabled ? 20 : 0 }] }]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.deviceInfo}>
        <Text style={styles.deviceTitle}>Current Device</Text>
        <View style={styles.deviceDetails}>
          <View style={styles.deviceIcon}>
            <Ionicons name="phone-portrait" size={24} color={theme.primary} />
          </View>
          <View style={styles.deviceText}>
            <Text style={styles.deviceName}>iPhone 13 Pro</Text>
            <Text style={styles.deviceStatus}>Last accessed: Just now</Text>
          </View>
          <TouchableOpacity style={styles.deviceAction}>
            <Ionicons name="settings-outline" size={20} color={theme.iconMuted} />
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: 60
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  securityScore: {
    margin: 20,
    padding: 20,
    backgroundColor: theme.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.primary
  },
  scoreBar: {
    height: 8,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden'
  },
  scoreProgress: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4
  },
  scoreText: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 8
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
  accessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  accessItemLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  accessItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  accessItemLabel: {
    fontSize: 16
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2
  },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: theme.surface,
    borderRadius: 10
  },
  deviceInfo: {
    margin: 20,
    marginTop: 24
  },
  deviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16
  },
  deviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 16
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  deviceText: {
    flex: 1
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text
  },
  deviceStatus: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4
  },
  deviceAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
