// ============================================================================
// APPLY FOR CARD SCREEN — Virtual & Physical Card Issuance
// Connected to shared useApplyForCardDomain from @nordi/shared/client-usecase
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useApplyForCardDomain } from '@nordi/shared/client-usecase';

export default function ApplyForCardScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const [cardType, setCardType] = useState<'virtual' | 'physical'>('virtual');
  const [nameOnCard, setNameOnCard] = useState('John Doe');

  const {
    handleApply,
    isApplying,
    selectedBrand,
    setSelectedBrand,
    issuanceFee,
  } = useApplyForCardDomain({
    onNavigate: () => {
      Alert.alert(
        'Card Ordered!',
        `Your ${cardType} card has been created and linked to your wallet.`,
        [{ text: 'View Cards', onPress: () => router.replace('/screens/cards') }]
      );
    },
  });

  const onSubmit = () => {
    handleApply(cardType);
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Apply for Nordi Card"
        subtitle="Virtual cards issued in seconds • Worldwide physical delivery"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Text style={s.sectionTitle}>Select Card Format</Text>
        <View style={s.typeToggleRow}>
          <TouchableOpacity
            style={[s.typeCard, cardType === 'virtual' && s.typeCardActive]}
            onPress={() => setCardType('virtual')}
          >
            <Ionicons
              name="phone-portrait"
              size={22}
              color={cardType === 'virtual' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[s.typeTitle, cardType === 'virtual' && s.typeTitleActive]}>
              Virtual Card
            </Text>
            <Text style={s.typeSub}>Instant issuance • Free</Text>
            <Badge variant="success" size="sm" style={{ marginTop: 8 }}>Zero Fee</Badge>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.typeCard, cardType === 'physical' && s.typeCardActive]}
            onPress={() => setCardType('physical')}
          >
            <Ionicons
              name="card"
              size={22}
              color={cardType === 'physical' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[s.typeTitle, cardType === 'physical' && s.typeTitleActive]}>
              Physical Metal Card
            </Text>
            <Text style={s.typeSub}>3-5 days delivery</Text>
            <Badge variant="primary" size="sm" style={{ marginTop: 8 }}>${issuanceFee || 15} USD</Badge>
          </TouchableOpacity>
        </View>

        <Text style={[s.sectionTitle, { marginTop: 20 }]}>Card Payment Network</Text>
        <View style={s.networkRow}>
          {(['visa', 'mastercard'] as const).map((brand) => (
            <TouchableOpacity
              key={brand}
              style={[s.networkBtn, selectedBrand === brand && s.networkBtnActive]}
              onPress={() => setSelectedBrand(brand)}
            >
              <Ionicons
                name={brand === 'visa' ? 'card-outline' : 'disc-outline'}
                size={18}
                color={selectedBrand === brand ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[s.networkText, selectedBrand === brand && s.networkTextActive]}>
                {brand.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.sectionTitle, { marginTop: 20 }]}>Cardholder Name</Text>
        <Card style={s.inputCard}>
          <CardContent style={{ padding: 12 }}>
            <TextInput
              value={nameOnCard}
              onChangeText={setNameOnCard}
              style={s.input}
              placeholder="Name on card"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </CardContent>
        </Card>

        <Button
          title={isApplying ? 'Processing Order...' : `Order ${cardType === 'virtual' ? 'Instant Virtual Card' : 'Physical Card'}`}
          variant="primary"
          size="lg"
          onPress={onSubmit}
          disabled={isApplying}
          style={{ marginTop: 24 }}
        />
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
    typeToggleRow: {
      flexDirection: 'row',
      gap: 12,
    },
    typeCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: 14,
      alignItems: 'flex-start',
    },
    typeCardActive: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}08`,
    },
    typeTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginTop: 8,
      marginBottom: 2,
    },
    typeTitleActive: {
      color: theme.colors.primary,
    },
    typeSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    networkRow: {
      flexDirection: 'row',
      gap: 12,
    },
    networkBtn: {
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
    networkBtnActive: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}08`,
    },
    networkText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    networkTextActive: {
      color: theme.colors.primary,
    },
    inputCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    input: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
  });
}
