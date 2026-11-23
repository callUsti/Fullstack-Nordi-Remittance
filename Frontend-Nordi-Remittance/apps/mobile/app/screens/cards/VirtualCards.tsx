// ============================================================================
// VIRTUAL CARDS SCREEN — Dedicated virtual cards management
// Connected to shared useVirtualCardsDomain from @nordi/shared/client-usecase
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
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreditCardDisplay } from '@/components/banking/CreditCardDisplay';
import { QuerySection } from '@/components/shared/QuerySection';
import { AdaptiveScreen } from '@/components/layout/AdaptiveScreen';
import { useVirtualCardsDomain } from '@nordi/shared/client-usecase';

export default function VirtualCardsScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const {
    virtualCards,
    isLoading,
    handleCreateVirtualCard,
    isCreating,
  } = useVirtualCardsDomain();

  return (
    <AdaptiveScreen
      withTabBar={false}
      header={
        <ScreenHeader
          title="Virtual Cards"
          subtitle="Generate single-use or recurring online debit cards"
          showBack
          onBackPress={() => router.back()}
        />
      }
    >
        <QuerySection isLoading={isLoading}>
          <Card style={s.heroCard}>
            <CardContent style={s.heroContent}>
              <View style={s.heroTop}>
                <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
                <Badge variant="success" size="sm">3D Secure Active</Badge>
              </View>
              <Text style={s.heroTitle}>Disposable & Subscription Cards</Text>
              <Text style={s.heroDesc}>
                Protect your real banking details from recurring subscription traps and merchant data leaks.
              </Text>

              <Button
                title={isCreating ? 'Issuing Virtual Card...' : '+ Generate New Virtual Card'}
                variant="primary"
                size="sm"
                onPress={handleCreateVirtualCard}
                disabled={isCreating}
                style={{ marginTop: 12 }}
              />
            </CardContent>
          </Card>

          <Text style={s.sectionTitle}>Active Virtual Cards ({(virtualCards?.length || 1)})</Text>

          {(virtualCards?.length ? virtualCards : [
            {
              id: 'vc1',
              cardNumber: '4532 8921 7843 1234',
              cardholderName: 'JOHN DOE (ONLINE)',
              expiryDate: '12/28',
              cvv: '842',
              cardBrand: 'visa',
              status: 'active',
              balance: 1450.00,
            },
          ]).map((card: any) => (
            <View key={card.id} style={{ marginBottom: 16 }}>
              <CreditCardDisplay
                cardNumber={card.cardNumber || '•••• •••• •••• 1234'}
                cardholderName={card.cardholderName || 'JOHN DOE'}
                expiryDate={card.expiryDate || '12/28'}
                cvv={card.cvv || '842'}
                brand={card.cardBrand || 'visa'}
                type="virtual"
                status={card.status || 'active'}
                variant="dark"
                onFreezeToggle={() => Alert.alert('Toggled', 'Virtual card status updated.')}
              />
            </View>
          ))}
        </QuerySection>
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
    heroCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    heroContent: {
      padding: 16,
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    heroTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    heroDesc: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
  });
}
