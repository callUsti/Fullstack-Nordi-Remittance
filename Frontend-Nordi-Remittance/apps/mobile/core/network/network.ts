import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type NetworkQuality = 'offline' | 'poor' | 'slow' | 'good';

export interface NetworkState {
  quality: NetworkQuality;
  isOnline: boolean;
  isSlowNetwork: boolean;
  effectiveType: string | null;
  rtt: number;
  downlink: number;
  lastChanged: number;
  hasConfirmedConnection: boolean;
}

let currentState: NetworkState = {
  quality: 'good',
  isOnline: true,
  isSlowNetwork: false,
  effectiveType: null,
  rtt: 0,
  downlink: 10,
  lastChanged: Date.now(),
  hasConfirmedConnection: true,
};

const listeners = new Set<() => void>();

function updateState(netInfo: NetInfoState) {
  const isOnline = Boolean(netInfo.isConnected && netInfo.isInternetReachable !== false);
  const isCellular = netInfo.type === 'cellular';
  const isPoor = isCellular && (netInfo.details as any)?.cellularGeneration === '2g';
  const isSlow = isCellular && (netInfo.details as any)?.cellularGeneration === '3g';

  let quality: NetworkQuality = 'good';
  if (!isOnline) {
    quality = 'offline';
  } else if (isPoor) {
    quality = 'poor';
  } else if (isSlow) {
    quality = 'slow';
  }

  currentState = {
    quality,
    isOnline,
    isSlowNetwork: isPoor || isSlow,
    effectiveType: (netInfo.details as any)?.cellularGeneration || netInfo.type,
    rtt: 0,
    downlink: 10,
    lastChanged: Date.now(),
    hasConfirmedConnection: isOnline,
  };

  listeners.forEach((listener) => listener());
}

// Subscribe to NetInfo updates
NetInfo.addEventListener(updateState);

export const networkDetector = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): NetworkState {
    return currentState;
  },
};
