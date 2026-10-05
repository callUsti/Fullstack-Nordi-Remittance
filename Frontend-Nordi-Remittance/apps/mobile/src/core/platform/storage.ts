// ============================================================================
// MOBILE STORAGE ADAPTER — Implements `KeyValueStorage` (see
// `@nordi/shared/core/platform/types`) on top of AsyncStorage so shared
// code (API token persistence, zustand `persist` middleware) works
// identically to the browser's `localStorage` on web.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStorage } from '@nordi/shared/core/platform/types';

export const asyncStorageAdapter: KeyValueStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};
