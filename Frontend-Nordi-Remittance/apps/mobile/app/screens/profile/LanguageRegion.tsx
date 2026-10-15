// ============================================================================
// LANGUAGE & REGION — Currency, language, timezone & date format settings
// ============================================================================
import React, { useState } from 'react';
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
import { Button } from '@/components/ui/Button';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR'];
const TIMEZONES = ['UTC-5 (EST)', 'UTC+0 (GMT)', 'UTC+1 (WAT)', 'UTC+3 (EAT)', 'UTC+8 (SGT)'];

export default function LanguageRegionScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedTimezone, setSelectedTimezone] = useState('UTC+0 (GMT)');

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Language & Region"
        subtitle="Set your preferred language, currency & timezone"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Language */}
        <Text style={s.sectionLabel}>Language</Text>
        <Card style={s.card}>
          <CardContent style={s.cardContent}>
            {LANGUAGES.map((lang, idx) => (
              <TouchableOpacity
                key={lang.code}
                style={[s.option, idx < LANGUAGES.length - 1 && s.optionBorder]}
                onPress={() => setSelectedLang(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={s.flag}>{lang.flag}</Text>
                <Text style={s.optionName}>{lang.name}</Text>
                {selectedLang === lang.code && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>

        {/* Currency */}
        <Text style={s.sectionLabel}>Display Currency</Text>
        <Card style={s.card}>
          <CardContent style={s.cardContent}>
            <View style={s.chipRow}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.chip, selectedCurrency === c && s.chipActive]}
                  onPress={() => setSelectedCurrency(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, selectedCurrency === c && s.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Timezone */}
        <Text style={s.sectionLabel}>Timezone</Text>
        <Card style={s.card}>
          <CardContent style={s.cardContent}>
            {TIMEZONES.map((tz, idx) => (
              <TouchableOpacity
                key={tz}
                style={[s.option, idx < TIMEZONES.length - 1 && s.optionBorder]}
                onPress={() => setSelectedTimezone(tz)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={s.optionName}>{tz}</Text>
                {selectedTimezone === tz && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>

        <Button variant="primary" onPress={() => {}} style={s.saveBtn}>
          Save Settings
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
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      gap: 10,
    },
    optionBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    flag: { fontSize: 20 },
    optionName: { flex: 1, fontSize: 14, color: theme.colors.textPrimary },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    chipActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}15` },
    chipText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
    chipTextActive: { color: theme.colors.primary, fontWeight: '700' },
    saveBtn: { marginTop: 4 },
  });
}
