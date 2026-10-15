// ============================================================================
// PERSONAL INFORMATION — Client profile, address, employment & bank accounts
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
import { Badge } from '@/components/ui/Badge';
import { QuerySection } from '@/components/shared/QuerySection';
import {
  useClientProfile,
  useClientAddress,
  useClientEmployment,
  useClientBankAccounts,
} from '@nordi/shared/client-usecase';

interface InfoRowProps {
  icon: string;
  label: string;
  value?: string | null;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
  const theme = useMobileTheme();
  const s = rowStyles(theme);
  return (
    <View style={s.row}>
      <View style={s.iconWrap}>
        <Ionicons name={icon as any} size={16} color={theme.colors.primary} />
      </View>
      <View style={s.textWrap}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.value}>{value || '—'}</Text>
      </View>
    </View>
  );
};

function rowStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 12 },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: { flex: 1 },
    label: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 2 },
    value: { fontSize: 13, fontWeight: '500', color: theme.colors.textPrimary },
  });
}

export default function PersonalInformationScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const profileQuery = useClientProfile();
  const addressQuery = useClientAddress();
  const employmentQuery = useClientEmployment();
  const accountsQuery = useClientBankAccounts();

  const profile = (profileQuery as any)?.user ?? (profileQuery as any)?.data;
  const address = (addressQuery as any)?.address ?? (addressQuery as any)?.data;
  const employment = (employmentQuery as any)?.employment ?? (employmentQuery as any)?.data;
  const accounts = (accountsQuery as any)?.accounts ?? (accountsQuery as any)?.data ?? [];

  const fmtDate = (d?: string | null) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return d; }
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Personal Information"
        subtitle="Your profile & identity details"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <QuerySection query={profileQuery} loadingRows={4}>
          {/* Identity */}
          <Card style={s.card}>
            <CardContent style={s.cardContent}>
              <View style={s.sectionHeader}>
                <Ionicons name="person-circle-outline" size={18} color={theme.colors.primary} />
                <Text style={s.sectionTitle}>Identity</Text>
                <Badge variant={profile?.kycStatus === 'verified' ? 'success' : 'warning'} size="sm">
                  {profile?.kycStatus ?? 'Pending'}
                </Badge>
              </View>
              <InfoRow icon="person-outline" label="Full Name" value={`${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`} />
              <InfoRow icon="calendar-outline" label="Date of Birth" value={fmtDate(profile?.dateOfBirth)} />
              <InfoRow icon="globe-outline" label="Nationality" value={profile?.nationality} />
              <InfoRow icon="mail-outline" label="Email" value={profile?.email} />
              <InfoRow icon="call-outline" label="Phone" value={profile?.phone} />
            </CardContent>
          </Card>

          {/* Address */}
          <QuerySection query={addressQuery} loadingRows={3}>
            <Card style={s.card}>
              <CardContent style={s.cardContent}>
                <View style={s.sectionHeader}>
                  <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
                  <Text style={s.sectionTitle}>Address</Text>
                </View>
                <InfoRow icon="home-outline" label="Street" value={address?.street} />
                <InfoRow icon="business-outline" label="City / State" value={`${address?.city ?? ''}, ${address?.state ?? ''}`} />
                <InfoRow icon="map-outline" label="Country" value={address?.country} />
                <InfoRow icon="barcode-outline" label="Postal Code" value={address?.postalCode} />
              </CardContent>
            </Card>
          </QuerySection>

          {/* Employment */}
          <QuerySection query={employmentQuery} loadingRows={3}>
            <Card style={s.card}>
              <CardContent style={s.cardContent}>
                <View style={s.sectionHeader}>
                  <Ionicons name="briefcase-outline" size={18} color={theme.colors.primary} />
                  <Text style={s.sectionTitle}>Employment</Text>
                </View>
                <InfoRow icon="business-outline" label="Employer" value={employment?.employer} />
                <InfoRow icon="ribbon-outline" label="Job Title" value={employment?.jobTitle} />
                <InfoRow icon="cash-outline" label="Annual Income" value={employment?.annualIncome ? `$${Number(employment.annualIncome).toLocaleString()}` : null} />
              </CardContent>
            </Card>
          </QuerySection>
        </QuerySection>

        <TouchableOpacity
          style={s.editBtn}
          onPress={() => router.push('/screens/profile/ClientUserEdit' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={s.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useMobileTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    cardContent: { padding: 16 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 4,
    },
    editBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  });
}
