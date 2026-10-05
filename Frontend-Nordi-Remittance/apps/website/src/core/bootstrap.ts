// ============================================================================
// WEB BOOTSTRAP — Wires the platform-agnostic `@nordi/shared` modules to
// their browser-specific implementations. Must run once, before the React
// tree renders (see `main.tsx`). Mirrors `apps/mobile/src/core/bootstrap.ts`,
// which wires the same shared modules to React Native implementations.
// ============================================================================

import { configureApiClient } from "@nordi/shared/core/api/client";
import { configureSocket } from "@nordi/shared/core/socket/socket.client";
import { configureOnlineManager } from "@nordi/shared/core/lib/queryClient";
import { configureAuthStore } from "@nordi/shared/store/auth.store";
import { networkDetector } from "./network/detector";
import { sessionManager } from "./auth/session.manager";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
const SOCKET_URL =
  import.meta.env.VITE_WS_URL ||
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

export function bootstrapWebPlatform(): void {
  configureApiClient({
    baseURL: API_BASE_URL,
    networkReporter: networkDetector,
    sessionGuard: sessionManager,
  });
  configureSocket({ url: SOCKET_URL });
  configureOnlineManager(networkDetector);

  // Note: `configureDefaultStorage`/persist storage and `configureThemeStore`
  // are intentionally NOT called here — their shared defaults already detect
  // `localStorage`/`window.matchMedia`/`document` and behave exactly like the
  // original web-only implementation. See `packages/shared/src/core/platform/storage.ts`
  // and `packages/shared/src/store/theme.store.ts`.
  configureAuthStore({
    onLogout: () => {
      try {
        localStorage.removeItem("nordi_session_expired");
      } catch {
        // ignore
      }
      if (typeof window !== "undefined" && (window as unknown as { Clerk?: { signOut: () => Promise<void> } }).Clerk) {
        (window as unknown as { Clerk: { signOut: () => Promise<void> } }).Clerk.signOut().catch(() => {});
      }
    },
  });
}
