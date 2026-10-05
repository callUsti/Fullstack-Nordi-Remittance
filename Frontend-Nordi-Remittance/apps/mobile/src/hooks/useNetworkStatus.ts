import { useSyncExternalStore } from 'react';
import { networkDetector, NetworkState } from '../core/network/network';

export function useNetworkStatus(): NetworkState {
  return useSyncExternalStore(
    networkDetector.subscribe,
    networkDetector.getSnapshot,
    networkDetector.getSnapshot
  );
}

export default useNetworkStatus;
