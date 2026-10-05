// ============================================================================
// MOBILE BOOTSTRAP — Wires the platform-agnostic `@nordi/shared` modules to
// their React Native implementations. Must run once, before the app renders
// (see `app/_layout.tsx`). Mirrors `apps/website/src/core/bootstrap.ts`,
// which wires the same shared modules to browser implementations.
// ============================================================================

import './bootstrap-storage';
import { configureApiClient } from '@nordi/shared/core/api/client';
import { configureSocket } from '@nordi/shared/core/socket/socket.client';
import { configureOnlineManager } from '@nordi/shared/core/lib/queryClient';
import { configureAuthStore } from '@nordi/shared/store/auth.store';
import { configureThemeStore } from '@nordi/shared/store/theme.store';
import { Appearance } from 'react-native';
import { asyncStorageAdapter } from './platform/storage';
import { mobileNetworkReporter } from './platform/network';
import { API_URL as BASE_URL, WS_URL } from './config/config';

export function bootstrapMobilePlatform(): void {
  configureApiClient({
    baseURL: BASE_URL,
    tokenStorage: asyncStorageAdapter,
    networkReporter: mobileNetworkReporter,
  });
  configureSocket({ url: WS_URL });
  configureOnlineManager(mobileNetworkReporter);

  // No Clerk/web session on mobile yet — logout only needs to clear local
  // auth state, which the shared `auth.store` already does by default.
  configureAuthStore({ onLogout: () => {} });

  // RN has no DOM to toggle a `dark` class on — theme application is handled
  // by screens reading `isDarkMode` from the store directly via React state.
  configureThemeStore({
    getSystemPreference: () => Appearance.getColorScheme() === 'dark',
    applyTheme: () => {},
  });
}
