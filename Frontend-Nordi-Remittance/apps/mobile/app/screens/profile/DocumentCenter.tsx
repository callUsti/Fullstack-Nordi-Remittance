// ============================================================================
// DOCUMENT CENTER — Upload & manage identity documents
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
import { Badge } from '@/components/ui/Badge';

interface DocType {
  id: string;
  name: string;
  status: 'verified' | 'pending' | 'rejected' | 'missing';
  icon: string;
  expiry?: string;
}

const docs: DocType[] = [
  { id: '1', name: 'National ID / Passport', icon: 'id-card-outline', status: 'verified', expiry: 'Dec 2028' },
  { id: '2', name: 'Proof of Address', icon: 'home-outline', status: 'verified', expiry: 'Mar 2027' },
  { id: '3', name: 'Bank Statement', icon: 'document-text-outline', status: 'pending' },
  { id: '4', name: 'Employment Letter', icon: 'briefcase-outline', status: 'missing' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
  verified: 'success',
  pending: 'warning',
  rejected: 'danger',
  missing: 'secondary',
};

export default function DocumentCenterScreen() {
  const router = useRouter();
  const theme = useMobileTheme();
  const s = createStyles(theme);

  const handleUpload = (docName: string) => {
    Alert.alert('Upload Document', `Select a file to upload for "${docName}"`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose File', onPress: () => Alert.alert('Info', 'File picker would open here') },
    ]);
  };

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Document Center"
        subtitle="Manage your identity & compliance documents"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Card style={s.infoCard}>
          <CardContent style={s.infoContent}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={s.infoText}>
              Keeping your documents up to date ensures uninterrupted access to all Nordi services.
            </Text>
          </CardContent>
        </Card>

        {docs.map((doc) => (
          <Card key={doc.id} style={s.card}>
            <CardContent style={s.cardContent}>
              <View style={s.docIcon}>
                <Ionicons name={doc.icon as any} size={22} color={theme.colors.primary} />
              </View>
              <View style={s.docInfo}>
                <Text style={s.docName}>{doc.name}</Text>
                {doc.expiry && (
                  <Text style={s.docExpiry}>Expires: {doc.expiry}</Text>
                )}
                <Badge variant={statusVariant[doc.status]} size="sm" style={s.badge}>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </Badge>
              </View>
              <TouchableOpacity
                style={[
                  s.actionBtn,
                  doc.status === 'verified' && s.actionBtnVerified,
                ]}
                onPress={() => handleUpload(doc.name)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={doc.status === 'verified' ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={18}
                  color={doc.status === 'verified' ? theme.colors.success : theme.colors.primary}
                />
              </TouchableOpacity>
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
    infoCard: {
      backgroundColor: `${theme.colors.primary}10`,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
      marginBottom: 16,
    },
    infoContent: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 10 },
    infoText: { flex: 1, fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    docIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    docInfo: { flex: 1, gap: 4 },
    docName: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary },
    docExpiry: { fontSize: 11, color: theme.colors.textSecondary },
    badge: { alignSelf: 'flex-start' },
    actionBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnVerified: { borderColor: `${theme.colors.success}40`, backgroundColor: `${theme.colors.success}10` },
  });
}
