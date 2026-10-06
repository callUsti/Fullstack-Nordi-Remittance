// ============================================================================
// CLERK EXPO SETUP & PROVIDER — React Native / Expo
// ============================================================================

import React, { createContext, useContext } from 'react';
import { ClerkProvider, useAuth as useClerkAuth, useSignIn, useOAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useClerkSync } from '@nordi/shared/hooks/api-queries/useAuth';
import { useAuthStore } from '@nordi/shared/store/auth.store';
import { processAuthSyncResponse } from './clerkSync.helper';

// Complete any pending auth session in the web browser
WebBrowser.maybeCompleteAuthSession();

// ========================
// TOKEN CACHE (SecureStore)
// ========================
export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // non-blocking
    }
  },
  async clearToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // non-blocking
    }
  },
};

// ========================
// PUBLISHABLE KEY
// ========================
const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.CLERK_PUBLISHABLE_KEY ||
  '';

// ========================
// CONTEXT FOR FALLBACK
// ========================
const ClerkAvailableContext = createContext<boolean>(Boolean(CLERK_PUBLISHABLE_KEY));

export const useIsClerkAvailable = () => useContext(ClerkAvailableContext);

// ========================
// CLERK PROVIDER WRAPPER
// ========================
export const MobileClerkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!CLERK_PUBLISHABLE_KEY) {
    if (__DEV__) {
      console.warn(
        '[Clerk] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not configured. Running in offline/fallback auth mode.'
      );
    }
    return (
      <ClerkAvailableContext.Provider value={false}>
        {children}
      </ClerkAvailableContext.Provider>
    );
  }

  return (
    <ClerkAvailableContext.Provider value={true}>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        tokenCache={tokenCache}
      >
        {children}
      </ClerkProvider>
    </ClerkAvailableContext.Provider>
  );
};

// ========================
// SOCIAL AUTH HOOK
// ========================
export function useClerkSocialAuth() {
  const isClerkAvailable = useIsClerkAvailable();
  const { setAuthenticated } = useAuthStore();
  const clerkSyncMutation = useClerkSync();

  // If clerk is available, useOAuth flow
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const signInWithGoogle = async (navigator: any) => {
    if (!isClerkAvailable) {
      throw new Error('Social sign-in requires Clerk to be configured with EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.');
    }

    try {
      const redirectUrl = Linking.createURL('/(auth)/login', { scheme: 'nordi' });
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        
        // Retrieve session token from SecureStore or wait for Clerk session
        const sessionToken = await tokenCache.getToken('__clerk_client_jwt') || createdSessionId;
        
        // Sync with backend
        const response = await clerkSyncMutation.mutateAsync(sessionToken);
        processAuthSyncResponse(response, navigator, setAuthenticated);
        return { success: true };
      }

      return { success: false, reason: 'Flow cancelled or incomplete' };
    } catch (err: any) {
      console.error('[Clerk] Google sign-in failed:', err);
      throw err;
    }
  };

  return {
    signInWithGoogle,
    isLoading: clerkSyncMutation.isPending,
    isClerkAvailable,
  };
}

export { useClerkAuth, useSignIn };
