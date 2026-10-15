// ============================================================================
// ACTIVITY LOGS — Login history & active sessions
// ============================================================================
import React from 'react';
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
import { Badge } from '@/components/ui/Badge';

interface ActivityEntry {
  id: string;
  device: string;
  location: string;
  time: string;
  type: string;
  current?: boolean;
  suspicious?: boolean;
}

const ACTIVITIES: ActivityEntry[] = [
  { id: '1', device: 'iPhone 15 Pro — iOS', location: 'Lagos, Nigeria', time: 'Just now', type: 'Login', current: true },
  { id: '2', device: 'Chrome — Windows 11', location: 'Lagos, Nigeria', time: '2 hours ago', type: 'Login' },
  { id: '3', device: 'Safari — macOS', location: 'London, UK', time: 'Yesterday, 8:14 PM', type: 'Login' },
  { id: '4', device: 'Unknown device', location: 'Unknown location', time: '3 days ago', type: 'Failed Attempt', suspicious: true },
  { id: '5', device: 'Firefox — Ubuntu', location: 'Lagos, Nigeria', time: '5 days ago', type: 'Login' },
];

export default function ActivityLogsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const handleTerminate = (id: string) => {
    Alert.alert('Terminate Session', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Terminate', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Activity Logs"
        subtitle="Recent login & session history"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <TouchableOpacity style={s.terminateAllBtn} activeOpacity={0.8} onPress={() => {}}>
          <Ionicons name="log-out-outline" size={16} color={theme.colors.danger} />
          <Text style={s.terminateAllText}>Terminate All Other Sessions</Text>
        </TouchableOpacity>

        {ACTIVITIES.map((log) => (
          <Card key={log.id} style={[s.card, log.suspicious && s.suspiciousCard]}>
            <CardContent style={s.cardContent}>
              <View style={[s.logIcon, log.suspicious && s.suspiciousIcon]}>
                <Ionicons
                  name={log.suspicious ? 'warning-outline' : 'phone-portrait-outline'}
                  size={20}
                  color={log.suspicious ? theme.colors.danger : theme.colors.primary}
                />
              </View>
              <View style={s.logInfo}>
                <View style={s.logHeader}>
                  <Text style={s.logDevice}>{log.device}</Text>
                  {log.current && <Badge variant="success" size="sm">Current</Badge>}
                  {log.suspicious && <Badge variant="danger" size="sm">Suspicious</Badge>}
                </View>
                <View style={s.logMeta}>
                  <Ionicons name="location-outline" size={11} color={theme.colors.textSecondary} />
                  <Text style={s.logLocation}>{log.location}</Text>
                </View>
                <View style={s.logMeta}>
                  <Ionicons name="time-outline" size={11} color={theme.colors.textSecondary} />
                  <Text style={s.logTime}>{log.time}</Text>
                </View>
              </View>
              {!log.current && (
                <TouchableOpacity onPress={() => handleTerminate(log.id)} style={s.terminateBtn}>
                  <Ionicons name="close-circle-outline" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </CardContent>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    terminateAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      marginBottom: 12,
    },
    terminateAllText: { fontSize: 13, color: theme.colors.danger, fontWeight: '600' },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    suspiciousCard: { borderColor: `${theme.colors.danger}40`, backgroundColor: `${theme.colors.danger}05` },
    cardContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
    logIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    suspiciousIcon: { backgroundColor: `${theme.colors.danger}15` },
    logInfo: { flex: 1, gap: 4 },
    logHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    logDevice: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, flex: 1 },
    logMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    logLocation: { fontSize: 11, color: theme.colors.textSecondary },
    logTime: { fontSize: 11, color: theme.colors.textSecondary },
    terminateBtn: { padding: 4 },
  });
}
