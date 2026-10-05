// ============================================================================
// DEFAULT STORAGE — Falls back to `localStorage` when running in a browser,
// otherwise an in-memory Map. Mobile overrides this via `configureStorage`
// (see apps/mobile/src/core/platform/storage.ts, backed by AsyncStorage).
// ============================================================================

import type { KeyValueStorage } from './types';

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

class InMemoryStorage implements KeyValueStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

class BrowserLocalStorage implements KeyValueStorage {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }
  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}

let activeStorage: KeyValueStorage = hasLocalStorage() ? new BrowserLocalStorage() : new InMemoryStorage();

/**
 * Overrides the default storage backend. Call once at app bootstrap.
 * - Web: never needs to call this (localStorage is used automatically).
 * - Mobile: call with an AsyncStorage-backed adapter before rendering.
 */
export function configureDefaultStorage(storage: KeyValueStorage): void {
  activeStorage = storage;
}

export function getDefaultStorage(): KeyValueStorage {
  return activeStorage;
}
