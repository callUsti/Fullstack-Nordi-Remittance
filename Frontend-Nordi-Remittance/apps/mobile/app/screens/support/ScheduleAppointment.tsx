// ============================================================================
// SCHEDULE APPOINTMENT — Book a call with a Nordi advisor
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const DATES = ['Mon 14', 'Tue 15', 'Wed 16', 'Thu 17', 'Fri 18'];
const SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];
const TYPES = [
  { id: 'video', icon: 'videocam-outline', label: 'Video Call' },
  { id: 'phone', icon: 'call-outline', label: 'Phone Call' },
  { id: 'office', icon: 'business-outline', label: 'Office Visit' },
];

export default function ScheduleAppointmentScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [selectedDate, setSelectedDate] = useState('Mon 14');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedType, setSelectedType] = useState('video');

  const handleBook = () => {
    if (!selectedSlot) {
      Alert.alert('Error', 'Please select a time slot.');
      return;
    }
    Alert.alert(
      'Appointment Booked!',
      `Your ${selectedType} appointment is scheduled for ${selectedDate} at ${selectedSlot}.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Schedule Appointment"
        subtitle="Book a session with a Nordi advisor"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Appointment Type */}
        <Text style={s.sectionLabel}>Appointment Type</Text>
        <View style={s.typeRow}>
          {TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[s.typeBtn, selectedType === type.id && s.typeBtnActive]}
              onPress={() => setSelectedType(type.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={type.icon as any}
                size={20}
                color={selectedType === type.id ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[s.typeLabel, selectedType === type.id && s.typeLabelActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Selection */}
        <Text style={s.sectionLabel}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dateScroll}>
          {DATES.map((date) => (
            <TouchableOpacity
              key={date}
              style={[s.dateChip, selectedDate === date && s.dateChipActive]}
              onPress={() => setSelectedDate(date)}
              activeOpacity={0.7}
            >
              <Text style={[s.dateChipText, selectedDate === date && s.dateChipTextActive]}>
                {date}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time Slots */}
        <Text style={s.sectionLabel}>Available Slots</Text>
        <View style={s.slotsGrid}>
          {SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[s.slotBtn, selectedSlot === slot && s.slotBtnActive]}
              onPress={() => setSelectedSlot(slot)}
              activeOpacity={0.7}
            >
              <Text style={[s.slotText, selectedSlot === slot && s.slotTextActive]}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        {selectedSlot && (
          <Card style={s.summaryCard}>
            <CardContent style={s.summaryContent}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={s.summaryText}>
                {TYPES.find((t) => t.id === selectedType)?.label} on{' '}
                <Text style={s.summaryBold}>{selectedDate}</Text> at{' '}
                <Text style={s.summaryBold}>{selectedSlot}</Text>
              </Text>
            </CardContent>
          </Card>
        )}

        <Button variant="primary" onPress={handleBook} style={s.bookBtn}>
          Confirm Booking
        </Button>
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
      marginBottom: 10,
      marginTop: 4,
    },
    typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    typeBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      gap: 6,
    },
    typeBtnActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` },
    typeLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' },
    typeLabelActive: { color: theme.colors.primary },
    dateScroll: { marginBottom: 20 },
    dateChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      marginRight: 8,
    },
    dateChipActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` },
    dateChipText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
    dateChipTextActive: { color: theme.colors.primary, fontWeight: '700' },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    slotBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    slotBtnActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` },
    slotText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
    slotTextActive: { color: theme.colors.primary, fontWeight: '700' },
    summaryCard: {
      backgroundColor: `${theme.colors.primary}10`,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
      marginBottom: 16,
    },
    summaryContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    summaryText: { fontSize: 13, color: theme.colors.textPrimary, flex: 1 },
    summaryBold: { fontWeight: '700', color: theme.colors.primary },
    bookBtn: { marginTop: 4 },
  });
}
