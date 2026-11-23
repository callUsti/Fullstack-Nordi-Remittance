// ============================================================================
// FEATURED & 1-TAP PAYMENT COMPONENT — Nordi Remittance Mobile
// Sleek, compact 1-tap transfer with real beneficiaries + luxury campaign slider
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMobileTheme } from '@/core/theme/useMobileTheme';
import { useBeneficiaries } from '@nordi/shared/hooks/api-queries/useAccounts';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

// Fallback high-profile payees if user hasn't added beneficiaries yet
const DEFAULT_BENEFICIARIES = [
  { id: '1', name: 'Sarah Jenkins', handle: 'Chase ••4821', avatar: 'SJ', color: '#3b82f6' },
  { id: '2', name: 'Alex Rivera', handle: 'Nordea ••9012', avatar: 'AR', color: '#8b5cf6' },
  { id: '3', name: 'Elena Rostova', handle: 'Revolut ••3340', avatar: 'ER', color: '#10b981' },
  { id: '4', name: 'David Chen', handle: 'Barclays ••1192', avatar: 'DC', color: '#f59e0b' },
  { id: '5', name: 'Amara Okafor', handle: 'Access ••7781', avatar: 'AO', color: '#ec4899' },
];

const CAMPAIGNS = [
  {
    id: 1,
    tag: 'LIMITED OFFER',
    title: 'Zero-Fee Remittance',
    description: 'Enjoy 0% FX transaction fee on all international wire transfers this week.',
    cta: 'Transfer Now',
    route: '/screens/send-money',
    gradient: ['#1e3a8a', '#1e40af'],
    icon: 'paper-plane-outline',
  },
  {
    id: 2,
    tag: 'HIGH YIELD',
    title: '6.2% APY USD Vaults',
    description: 'Grow your foreign currency reserves with automated daily interest payouts.',
    cta: 'Start Saving',
    route: '/screens/savings',
    gradient: ['#0f766e', '#115e59'],
    icon: 'trending-up-outline',
  },
  {
    id: 3,
    tag: 'NEW PERK',
    title: 'Nordi Metal Cards',
    description: 'Earn 2.5% instant cash-back on global dining and flight bookings.',
    cta: 'Order Card',
    route: '/screens/cards',
    gradient: ['#312e81', '#3730a3'],
    icon: 'card-outline',
  },
  {
    id: 4,
    tag: 'COMMUNITY',
    title: 'Refer & Earn $25',
    description: 'Invite friends to Nordi Remitwave and receive $25 bonus on their first transfer.',
    cta: 'Invite Friends',
    route: '/screens/rewards',
    gradient: ['#701a75', '#86198f'],
    icon: 'gift-outline',
  },
];

export const FeaturedComponent: React.FC = () => {
  const router = useRouter();
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  const [activeSlide, setActiveSlide] = useState(0);

  // TanStack Query for beneficiaries
  const { data: beneficiariesRaw } = useBeneficiaries();

  const beneficiariesList = React.useMemo(() => {
    const rawList = Array.isArray(beneficiariesRaw)
      ? beneficiariesRaw
      : (beneficiariesRaw as any)?.data || (beneficiariesRaw as any)?.beneficiaries || [];

    if (rawList.length > 0) {
      return rawList.slice(0, 8).map((b: any, idx: number) => {
        const name = b.name || b.fullName || b.accountName || 'Contact';
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
        return {
          id: b.id || b._id || String(idx),
          name,
          handle: b.bankName || b.currency || 'Bank',
          avatar: initials || 'CO',
          color: colors[idx % colors.length],
        };
      });
    }

    return DEFAULT_BENEFICIARIES;
  }, [beneficiariesRaw]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
    if (slideIndex >= 0 && slideIndex < CAMPAIGNS.length) {
      setActiveSlide(slideIndex);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── 1-Tap Quick Payment Section ── */}
      <View style={styles.paymentSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleWithIcon}>
            <Ionicons name="flash-outline" size={16} color={theme.primary} />
            <Text style={styles.sectionTitle}>1-Tap Transfer</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/screens/beneficiaries' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.headerLink}>Manage</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.beneficiaryList}
        >
          {/* Add New Payee Button */}
          <TouchableOpacity
            style={styles.addPayeeItem}
            onPress={() => router.push('/screens/beneficiaries' as any)}
            activeOpacity={0.75}
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={20} color={theme.primary} />
            </View>
            <Text style={styles.addPayeeText}>Add New</Text>
          </TouchableOpacity>

          {/* Payee Avatars */}
          {beneficiariesList.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={styles.payeeItem}
              onPress={() =>
                router.push({
                  pathname: '/screens/send-money' as any,
                  params: { recipientName: item.name },
                })
              }
              activeOpacity={0.75}
            >
              <View style={[styles.avatarCircle, { backgroundColor: item.color }]}>
                <Text style={styles.avatarText}>{item.avatar}</Text>
                <View style={styles.verifiedDot} />
              </View>
              <Text style={styles.payeeName} numberOfLines={1}>
                {item.name.split(' ')[0]}
              </Text>
              <Text style={styles.payeeHandle} numberOfLines={1}>
                {item.handle}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Featured Campaigns Section ── */}
      <View style={styles.featuredSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Offers</Text>
          <TouchableOpacity
            onPress={() => router.push('/screens/rewards' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.headerLink}>All Perks</Text>
          </TouchableOpacity>
        </View>

        {/* Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={CARD_WIDTH + 8}
          decelerationRate="fast"
          contentContainerStyle={styles.sliderContent}
        >
          {CAMPAIGNS.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => router.push(item.route as any)}
              style={styles.campaignSlide}
            >
              <LinearGradient
                colors={item.gradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.campaignCard}
              >
                <View style={styles.campaignLeft}>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{item.tag}</Text>
                  </View>
                  <Text style={styles.campaignTitle}>{item.title}</Text>
                  <Text style={styles.campaignDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>

                <View style={styles.campaignRight}>
                  <View style={styles.campaignIconCircle}>
                    <Ionicons name={item.icon as any} size={22} color="#ffffff" />
                  </View>
                  <View style={styles.ctaButton}>
                    <Text style={styles.ctaText}>{item.cta}</Text>
                    <Ionicons name="arrow-forward" size={12} color="#ffffff" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Indicators */}
        <View style={styles.indicatorContainer}>
          {CAMPAIGNS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                activeSlide === index ? styles.indicatorActive : styles.indicatorInactive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default FeaturedComponent;

const createStyles = (theme: ReturnType<typeof useMobileTheme>) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
      paddingVertical: 8,
    },
    paymentSection: {
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    titleWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.3,
    },
    headerLink: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    beneficiaryList: {
      gap: 12,
      paddingVertical: 2,
    },
    addPayeeItem: {
      alignItems: 'center',
      width: 58,
    },
    addIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: theme.primary,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primarySoft || 'rgba(37,99,235,0.06)',
      marginBottom: 4,
    },
    addPayeeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.primary,
      textAlign: 'center',
    },
    payeeItem: {
      alignItems: 'center',
      width: 58,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginBottom: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    avatarText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
    verifiedDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#22c55e',
      borderWidth: 1.5,
      borderColor: theme.background,
    },
    payeeName: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
    },
    payeeHandle: {
      fontSize: 9,
      fontWeight: '500',
      color: theme.textMuted,
      textAlign: 'center',
    },
    featuredSection: {
      marginTop: 4,
      marginBottom: 10,
    },
    sliderContent: {
      gap: 8,
    },
    campaignSlide: {
      width: CARD_WIDTH,
      borderRadius: 16,
      overflow: 'hidden',
    },
    campaignCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 14,
      borderRadius: 16,
      minHeight: 110,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    campaignLeft: {
      flex: 1,
      paddingRight: 10,
      justifyContent: 'space-between',
    },
    tagBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      marginBottom: 4,
    },
    tagText: {
      color: '#ffffff',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    campaignTitle: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 3,
      letterSpacing: -0.3,
    },
    campaignDesc: {
      color: '#e2e8f0',
      fontSize: 11,
      lineHeight: 15,
    },
    campaignRight: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    campaignIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.22)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    ctaText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: '700',
    },
    indicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
      marginTop: 8,
    },
    indicator: {
      height: 4,
      borderRadius: 2,
    },
    indicatorActive: {
      width: 16,
      backgroundColor: theme.primary,
    },
    indicatorInactive: {
      width: 6,
      backgroundColor: theme.border,
    },
  });
