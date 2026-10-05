// ============================================================================
// PERSIST STORAGE — zustand `persist` storage adapter shared across platforms
// ============================================================================
// Defaults to the shared default KeyValueStorage (localStorage on web, an
// in-memory Map otherwise). Mobile overrides this once at bootstrap with an
// AsyncStorage-backed adapter via `configurePersistStorage()`.
// ============================================================================

import type { StateStorage } from 'zustand/middleware';
import type { KeyValueStorage } from '../core/platform/types';
import { getDefaultStorage } from '../core/platform/storage';

let override: KeyValueStorage | null = null;

/** Overrides the storage backend used by every persisted zustand store. */
export function configurePersistStorage(storage: KeyValueStorage): void {
  override = storage;
}

/** Pass to `createJSONStorage(getPersistStorage)` in each persisted store. */
export const getPersistStorage = (): StateStorage => {
  const backend = override ?? getDefaultStorage();
  return {
    getItem: (name) => backend.getItem(name),
    setItem: (name, value) => backend.setItem(name, value),
    removeItem: (name) => backend.removeItem(name),
  };
};
