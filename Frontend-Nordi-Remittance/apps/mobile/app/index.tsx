// ============================================================================
// APP ENTRY POINT — Route Guard & Initialization
// ============================================================================

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { storageService } from '@/core/services/storage-service';
import { useAuthStore } from '@nordi/shared/store/auth.store';
import { TokenManager } from '@nordi/shared/core/api/client';
import { ScreenLoader } from '@/components/ui';

export default function IndexPage() {
  const [initialized, setInitialized] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  const { isAuthenticated, user, isInitialized } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    async function checkInitialRoute() {
      try {
        const seen = await storageService.hasSeenOnboarding();
        if (isMounted) {
          setIsFirstLaunch(!seen);
          setInitialized(true);
        }
      } catch {
        if (isMounted) {
          setIsFirstLaunch(false);
          setInitialized(true);
        }
      }
    }

    checkInitialRoute();

    return () => {
      isMounted = false;
    };
  }, []);

  // Show clean loader while inspecting local storage and auth store
  if (!initialized || !isInitialized) {
    return <ScreenLoader message="Starting Nordea Banking..." />;
  }

  // 1. First-time users see the Onboarding flow
  if (isFirstLaunch) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  // 2. Unauthenticated users are sent to the Login screen
  const isAuthed = isAuthenticated || TokenManager.isAuthenticated();
  if (!isAuthed) {
    return <Redirect href="/(auth)/login" />;
  }

  // 3. Authenticated users with pending email verification
  if (user && user.isEmailVerified === false) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  // 4. Authenticated users enter the main dashboard tabs
  return <Redirect href="/(tabs)" />;
}