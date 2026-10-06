import '../global.css';
import { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Appearance, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@nordi/shared/core/lib/queryClient';
import { bootstrapMobilePlatform } from '@/core/bootstrap';
import { useAuthStore } from '@nordi/shared/store/auth.store';
import { usePermissionsStore } from '@nordi/shared/store/permissions.store';
import useThemeStore from '@nordi/shared/store/theme.store';
import { colorScheme } from 'nativewind';
import { initializeDevicePermissions } from '@/core/utils/permission-handler';
import { storageService } from '@/core/services/storage-service';
import { MobileClerkProvider } from '@/core/auth/clerk';
import { ToastContainer } from '@/components/ui';
import MotionSplashScreen from '@/components/auth/MotionSplashScreen';

void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.error('Unable to hold the native splash screen:', error);
});



// Wire shared (`@nordi/shared`) modules to React Native implementations
// before anything in the component tree can call the API client, socket,
// or stores. Runs once at module load, mirroring `apps/website/src/main.tsx`.
bootstrapMobilePlatform();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': 'https://fonts.cdnfonts.com/s/16009/Poppins-Regular.woff',
    'Poppins-Medium': 'https://fonts.cdnfonts.com/s/16009/Poppins-Medium.woff',
    'Poppins-SemiBold': 'https://fonts.cdnfonts.com/s/16009/Poppins-SemiBold.woff',
    'Poppins-Bold': 'https://fonts.cdnfonts.com/s/16009/Poppins-Bold.woff'
  });

  const authInitialized = useAuthStore((state) => state.isInitialized);
  const devicePermissionsInitialized = usePermissionsStore(
    (state) => state.devicePermissionsInitialized,
  );
  const themeMode = useThemeStore((state) => state.mode);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const [startupInitialized, setStartupInitialized] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  const initializeStartup = useCallback(async () => {
    setStartupError(null);
    try {
      await Promise.all([
        initializeDevicePermissions(),
        storageService.hasSeenOnboarding(),
      ]);
      setStartupInitialized(true);
    } catch (error) {
      console.error('Unable to initialize the mobile app:', error);
      setStartupError('Some app services could not be initialized.');
    }
  }, []);

  useEffect(() => {
    void initializeStartup();
  }, [initializeStartup]);

  useEffect(() => {
    colorScheme.set(themeMode);
    useThemeStore.getState().initializeTheme();
  }, [themeMode]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(() => {
      useThemeStore.getState().initializeTheme();
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync().catch((error: unknown) => {
        console.error('Unable to hide the native splash screen:', error);
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const appInitialized =
    startupInitialized &&
    authInitialized &&
    devicePermissionsInitialized;

  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <MobileClerkProvider>
          <View style={styles.container}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="screens" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            {!appInitialized && (
              <View style={StyleSheet.absoluteFill}>
                <MotionSplashScreen
                  error={startupError}
                  onRetry={startupError ? initializeStartup : undefined}
                />
              </View>
            )}
          </View>
          <ToastContainer />
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        </MobileClerkProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
