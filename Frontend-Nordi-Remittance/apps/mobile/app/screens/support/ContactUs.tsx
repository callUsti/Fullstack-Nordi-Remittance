// ============================================================================
// CONTACT US — Phone, email, office locations & social links
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';

export default function ContactUsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const contacts = [
    { icon: 'call-outline', label: 'Customer Care', value: '+234 800 NORDI 00', action: () => Linking.openURL('tel:+2348006673400') },
    { icon: 'mail-outline', label: 'Email Support', value: 'support@nordi.finance', action: () => Linking.openURL('mailto:support@nordi.finance') },
    { icon: 'mail-open-outline', label: 'Complaints', value: 'complaints@nordi.finance', action: () => Linking.openURL('mailto:complaints@nordi.finance') },
    { icon: 'globe-outline', label: 'Help Center', value: 'help.nordi.finance', action: () => Linking.openURL('https://help.nordi.finance') },
  ];

  const offices = [
    { city: 'Lagos', address: '42 Marina Road, Victoria Island, Lagos, Nigeria', icon: '🇳🇬' },
    { city: 'London', address: '1 Canada Square, Canary Wharf, London, UK', icon: '🇬🇧' },
    { city: 'New York', address: '350 Fifth Avenue, New York, NY 10118, USA', icon: '🇺🇸' },
  ];

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Contact Us"
        subtitle="Reach us through any channel"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Text style={s.sectionLabel}>Get in Touch</Text>
        <Card style={s.card}>
          <CardContent style={s.cardContent}>
            {contacts.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[s.row, idx < contacts.length - 1 && s.rowBorder]}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <View style={s.rowIcon}>
                  <Ionicons name={item.icon as any} size={18} color={theme.colors.primary} />
                </View>
                <View style={s.rowText}>
                  <Text style={s.rowLabel}>{item.label}</Text>
                  <Text style={s.rowValue}>{item.value}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>

        <Text style={s.sectionLabel}>Office Locations</Text>
        {offices.map((office) => (
          <Card key={office.city} style={s.officeCard}>
            <CardContent style={s.officeContent}>
              <Text style={s.officeFlag}>{office.icon}</Text>
              <View>
                <Text style={s.officeCity}>{office.city}</Text>
                <Text style={s.officeAddress}>{office.address}</Text>
              </View>
            </CardContent>
          </Card>
        ))}

        <Text style={s.hoursTitle}>Business Hours</Text>
        <Card style={s.hoursCard}>
          <CardContent style={s.hoursContent}>
            {[
              { day: 'Monday – Friday', hours: '8:00 AM – 8:00 PM WAT' },
              { day: 'Saturday', hours: '9:00 AM – 5:00 PM WAT' },
              { day: 'Sunday', hours: 'Emergency support only' },
            ].map((h, idx, arr) => (
              <View key={h.day} style={[s.hourRow, idx < arr.length - 1 && s.hourBorder]}>
                <Text style={s.hourDay}>{h.day}</Text>
                <Text style={s.hourTime}>{h.hours}</Text>
              </View>
            ))}
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginTop: 4,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    cardContent: { padding: 4 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, gap: 12 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 12, color: theme.colors.textSecondary },
    rowValue: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginTop: 2 },
    officeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    officeContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
    officeFlag: { fontSize: 28 },
    officeCity: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 2 },
    officeAddress: { fontSize: 11, color: theme.colors.textSecondary, lineHeight: 16 },
    hoursTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginTop: 8,
    },
    hoursCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    hoursContent: { padding: 4 },
    hourRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14 },
    hourBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    hourDay: { fontSize: 13, color: theme.colors.textPrimary, fontWeight: '500' },
    hourTime: { fontSize: 12, color: theme.colors.textSecondary },
  });
}
