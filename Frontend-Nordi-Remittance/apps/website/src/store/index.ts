// ============================================================================
// STORE INDEX - Central export for all Zustand stores
// ============================================================================

// NOTE: The actual store implementations now live in `@nordi/shared/store`
// and are shared with the mobile app. This barrel re-exports them so every
// existing `@store` import across the website keeps working unchanged.

// Toast store - Global notifications
export { useToastStore, useToast, type Toast, type ToastType } from "@nordi/shared/store/toast.store";

// Auth store - Client-side authentication state
export {
  useAuthStore,
  useAuth,
  configureAuthStore,
  selectIsAuthenticated,
  selectUser,
  selectRequires2FA,
  selectIsLoading,
  selectIsInitialized,
} from "@nordi/shared/store/auth.store";

// UI store - User interface state
export {
  useUIStore,
  useTheme,
  useSidebar,
  useModal,
  usePreferences,
  selectTheme,
  selectCurrency,
  selectShowBalances,
  selectIsSidebarCollapsed,
  selectIsModalOpen,
  selectModalType,
} from "@nordi/shared/store/ui.store";

// Socket store - WebSocket connection state
export {
  useSocketStore,
  useSocketConnection,
  selectIsSocketConnected,
  selectSocketError,
  selectReconnectAttempts,
} from "@nordi/shared/store/socket.store";

// Theme store - Dark/light/system mode management
export { default as useThemeStore, configureThemeStore } from "@nordi/shared/store/theme.store";
export type { ThemeMode } from "@nordi/shared/store/theme.store";

// Admin Users store - Admin user management UI state
export { useAdminUsersStore } from "@nordi/shared/store/users.store";
