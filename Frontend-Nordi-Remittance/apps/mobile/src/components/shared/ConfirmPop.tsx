import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@nordi/shared/constants/colors';

export const ConfirmSuccess: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.card}>
          <Text style={styles.brandTitle}>NORDI</Text>
          <View style={[styles.iconContainer, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
          </View>
          <Text style={styles.titleSuccess}>Verification Successful</Text>
          <Text style={styles.subtitle}>Your identity has been verified.</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export const ConfirmError: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.card}>
          <Text style={styles.brandTitle}>NORDI</Text>
          <View style={[styles.iconContainer, { backgroundColor: '#fef2f2' }]}>
            <Ionicons name="alert-circle" size={64} color="#ef4444" />
          </View>
          <Text style={styles.titleError}>ID Verification Failed</Text>
          <Text style={styles.subtitle}>Please check your details and try again.</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary.DEFAULT,
    letterSpacing: 2,
    marginBottom: 16,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleSuccess: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleError: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
