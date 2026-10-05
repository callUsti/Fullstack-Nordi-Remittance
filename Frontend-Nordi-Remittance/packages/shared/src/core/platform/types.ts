// ============================================================================
// PLATFORM CONTRACTS — Interfaces each app (web / mobile) implements so that
// shared business logic (API client, stores, query cache) never imports a
// web-only (localStorage/window/document) or RN-only (AsyncStorage) API
// directly. Apps wire their concrete implementation once at bootstrap via
// the `configure*` functions exported next to each shared module.
// ============================================================================

/** Minimal persisted key/value storage contract (sync OR async). */
export interface KeyValueStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

/** Reports live connectivity/latency so the API client & query cache can react. */
export interface NetworkReporter {
  isOnline: boolean;
  subscribe(listener: () => void): () => void;
  reportLatency?(ms: number): void;
  reportRequestSuccess?(): void;
  reportNetworkError?(): void;
}

/** Forces the user out of an authenticated session (expired/invalid token). */
export interface SessionGuard {
  forceLogout(reason: string): void;
}
