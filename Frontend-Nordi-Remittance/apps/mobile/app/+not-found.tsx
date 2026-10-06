import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@nordi/shared/constants/colors';
import { useMobileTheme } from '@/core/theme/useMobileTheme';

export default function NotFoundScreen() {
  const theme = useMobileTheme();
  const styles = createStyles(theme);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>
        <Link href="/(tabs)">
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useMobileTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 16,
    color: colors.primary.DEFAULT,
    textDecorationLine: 'underline',
  },
});
