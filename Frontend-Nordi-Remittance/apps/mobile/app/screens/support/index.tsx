// ============================================================================
// SUPPORT HUB — FAQ, Live Chat, Contact Us, Schedule Appointment
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';

interface SupportOption {
  icon: string;
  label: string;
  desc: string;
  route: string;
  color: string;
}

export default function SupportScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const options: SupportOption[] = [
    { icon: 'help-circle-outline', label: 'FAQs', desc: 'Browse common questions & answers', route: '/screens/support/FAQs', color: '#6366f1' },
    { icon: 'chatbubbles-outline', label: 'Live Chat', desc: 'Chat with our support team in real-time', route: '/screens/support/LiveChat', color: '#10b981' },
    { icon: 'call-outline', label: 'Contact Us', desc: 'Phone, email & office locations', route: '/screens/support/ContactUs', color: '#f59e0b' },
    { icon: 'calendar-outline', label: 'Schedule Appointment', desc: 'Book a call with an advisor', route: '/screens/support/ScheduleAppointment', color: '#8b5cf6' },
  ];

  return (
    <View style={s.container}>
      <ScreenHeader title="Support Center" subtitle="We're here to help you" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Hero Banner */}
        <Card style={s.heroBanner}>
          <CardContent style={s.heroContent}>
            <Ionicons name="headset-outline" size={36} color="#fff" />
            <View>
              <Text style={s.heroTitle}>24/7 Customer Support</Text>
              <Text style={s.heroSubtitle}>Our team is always ready to help you</Text>
            </View>
          </CardContent>
        </Card>

        {/* Support Options */}
        <View style={s.grid}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.route}
              style={s.gridItem}
              onPress={() => router.push(opt.route as any)}
              activeOpacity={0.7}
            >
              <View style={[s.optIcon, { backgroundColor: `${opt.color}20` }]}>
                <Ionicons name={opt.icon as any} size={24} color={opt.color} />
              </View>
              <Text style={s.optLabel}>{opt.label}</Text>
              <Text style={s.optDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Contact */}
        <Card style={s.contactCard}>
          <CardContent style={s.contactContent}>
            <Text style={s.contactTitle}>Quick Contact</Text>
            {[
              { icon: 'call-outline', label: '+234 800 NORDI 00', desc: 'Mon–Fri, 9am–6pm WAT' },
              { icon: 'mail-outline', label: 'support@nordi.finance', desc: 'Response within 24 hours' },
              { icon: 'globe-outline', label: 'help.nordi.finance', desc: 'Self-service help center' },
            ].map((item, idx, arr) => (
              <View key={item.label} style={[s.contactRow, idx < arr.length - 1 && s.contactBorder]}>
                <View style={s.contactIcon}>
                  <Ionicons name={item.icon as any} size={16} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={s.contactLabel}>{item.label}</Text>
                  <Text style={s.contactDesc}>{item.desc}</Text>
                </View>
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
    heroBanner: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      marginBottom: 20,
      borderWidth: 0,
    },
    heroContent: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
    heroTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    heroSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    gridItem: {
      width: '47%',
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 16,
      gap: 8,
    },
    optIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    optLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },
    optDesc: { fontSize: 11, color: theme.colors.textSecondary, lineHeight: 15 },
    contactCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    contactContent: { padding: 16 },
    contactTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 12 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    contactBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    contactIcon: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactLabel: { fontSize: 13, fontWeight: '500', color: theme.colors.textPrimary },
    contactDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  });
}
