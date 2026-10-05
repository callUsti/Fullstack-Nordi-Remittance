// ============================================================================
// MOBILE NETWORK REPORTER — Implements `NetworkReporter` (see
// `@nordi/shared/core/platform/types`) on top of `@react-native-community/
// netinfo` so TanStack Query's `onlineManager` reacts to real connectivity
// changes instead of the web-only `navigator.onLine`.
// ============================================================================

import NetInfo from '@react-native-community/netinfo';
import type { NetworkReporter } from '@nordi/shared/core/platform/types';

class MobileNetworkReporter implements NetworkReporter {
  private online = true;
  private listeners = new Set<() => void>();

  constructor() {
    NetInfo.addEventListener((state) => {
      const nextOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (nextOnline !== this.online) {
        this.online = nextOnline;
        this.listeners.forEach((listener) => listener());
      }
    });
  }

  get isOnline(): boolean {
    return this.online;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const mobileNetworkReporter = new MobileNetworkReporter();
