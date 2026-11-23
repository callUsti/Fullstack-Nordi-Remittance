// ============================================================================
// CARD SECURITY SCREEN — PIN, Freezing, Channel toggles, & Fraud controls
// Connected to shared useCardSecurityDomain from @nordi/shared/client-usecase
// ============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useCardSecurityDomain } from '@nordi/shared/client-usecase';

export default function CardSecurityScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const {
    toggles,
    handleToggleOption,
    handleQuickAction,
    isPending,
  } = useCardSecurityDomain();

  return (
    <AdaptiveScreen
      withTabBar={false}
      header={
        <ScreenHeader
          title="Card Security & Controls"
          subtitle="Channel restrictions, freeze toggles & emergency freeze"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
        <Card style={s.metaCard}>
          <CardContent style={s.metaCardInner}>
            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.toggleTitle}>Online Purchases (E-Commerce)</Text>
                <Text style={s.toggleSub}>Allow internet payments via CVV code</Text>
              </View>
              <Switch
                value={toggles.isOnlineEnabled}
                onValueChange={() => handleToggleOption('isOnlineEnabled')}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </View>

            <View style={s.divider} />

            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.toggleTitle}>International Charges</Text>
                <Text style={s.toggleSub}>Allow transactions processed abroad</Text>
              </View>
              <Switch
                value={toggles.isInternationalEnabled}
                onValueChange={() => handleToggleOption('isInternationalEnabled')}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </View>

            <View style={s.divider} />

            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.toggleTitle}>Contactless (Tap & Pay)</Text>
                <Text style={s.toggleSub}>POS terminal contactless chip payments</Text>
              </View>
              <Switch
                value={toggles.isContactlessEnabled}
                onValueChange={() => handleToggleOption('isContactlessEnabled')}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </View>

            <View style={s.divider} />

            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.toggleTitle}>ATM Cash Withdrawals</Text>
                <Text style={s.toggleSub}>Allow physical cash withdrawal at ATMs</Text>
              </View>
              <Switch
                value={toggles.isAtmEnabled}
                onValueChange={() => handleToggleOption('isAtmEnabled')}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </View>
          </CardContent>
        </Card>

        <Text style={[s.sectionTitle, { marginTop: 12 }]}>Emergency Actions</Text>

        <View style={{ gap: 10 }}>
          <Button
            title="Freeze Card Temporarily"
            variant="outline"
            size="md"
            onPress={() => handleQuickAction('Freeze Card')}
            disabled={isPending}
          />
          <Button
            title="Reset Card PIN"
            variant="outline"
            size="md"
            onPress={() => handleQuickAction('Change PIN')}
            disabled={isPending}
          />
          <Button
            title="Report Lost / Stolen"
            variant="danger"
            size="md"
            onPress={() => {
              Alert.alert(
                'Report Lost Card',
                'This card will be permanently canceled and a replacement dispatched.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Cancel Card', style: 'destructive', onPress: () => handleQuickAction('Report Lost') },
                ]
              );
            }}
            disabled={isPending}
          />
        </View>
    </AdaptiveScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    metaCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    metaCardInner: {
      padding: 14,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
    },
    toggleTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    toggleSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 10,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 10,
    },
  });
}
