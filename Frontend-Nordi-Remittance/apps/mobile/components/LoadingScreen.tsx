import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors } from '@nordi/shared/constants/colors';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.primary} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
};

export default LoadingScreen;

const createStyles = (theme: ReturnType<typeof useMobileTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '500',
  },
});
