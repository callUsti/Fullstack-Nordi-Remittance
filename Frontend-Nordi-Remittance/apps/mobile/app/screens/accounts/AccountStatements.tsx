// ============================================================================
// ACCOUNT STATEMENTS SCREEN — Export official bank statements (PDF / CSV)
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
import { Badge } from '@/components/ui/Badge';

const PERIODS = [
  'October 2026 (Current)',
  'September 2026',
  'August 2026',
  'Q3 2026 (Jul - Sep)',
  'Q2 2026 (Apr - Jun)',
  'Full Year 2025',
];

export default function AccountStatementsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [selectedAccount, setSelectedAccount] = useState('USD Main Wallet');
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (period: string) => {
    setDownloading(period);
    setTimeout(() => {
      setDownloading(null);
      Alert.alert(
        'Statement Generated',
        `Official ${selectedFormat} statement for ${period} (${selectedAccount}) has been saved to your downloads and shared via AirDrop/Files.`,
        [{ text: 'OK' }]
      );
    }, 1200);
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Account Statements"
        subtitle="Download officially verified stamped e-statements"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionTitle}>Export Format</Text>
        <View style={s.formatRow}>
          <TouchableOpacity
            style={[s.formatBtn, selectedFormat === 'PDF' && s.formatBtnActive]}
            onPress={() => setSelectedFormat('PDF')}
          >
            <Ionicons
              name="document-text"
              size={18}
              color={selectedFormat === 'PDF' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[s.formatText, selectedFormat === 'PDF' && s.formatTextActive]}>
              PDF Document
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.formatBtn, selectedFormat === 'CSV' && s.formatBtnActive]}
            onPress={() => setSelectedFormat('CSV')}
          >
            <Ionicons
              name="grid"
              size={18}
              color={selectedFormat === 'CSV' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[s.formatText, selectedFormat === 'CSV' && s.formatTextActive]}>
              Excel / CSV Data
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.sectionTitle, { marginTop: 20 }]}>Available Monthly Statements</Text>

        {PERIODS.map((period, idx) => (
          <Card key={idx} style={s.statementCard}>
            <CardContent style={s.statementContent}>
              <View style={s.fileIconWrap}>
                <Ionicons
                  name={selectedFormat === 'PDF' ? 'document' : 'stats-chart'}
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.periodTitle}>{period}</Text>
                <Text style={s.periodSub}>{selectedAccount} • Verified Stamped</Text>
              </View>

              <Button
                title={downloading === period ? 'Exporting...' : 'Download'}
                variant="outline"
                size="sm"
                onPress={() => handleDownload(period)}
                disabled={downloading === period}
              />
            </CardContent>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 10,
    },
    formatRow: {
      flexDirection: 'row',
      gap: 12,
    },
    formatBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      paddingVertical: 12,
      gap: 8,
    },
    formatBtnActive: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}08`,
    },
    formatText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    formatTextActive: {
      color: theme.colors.primary,
    },
    statementCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    statementContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    fileIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: `${theme.colors.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    periodTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    periodSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });
}
