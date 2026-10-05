// Moved to the shared package — re-exported for backwards-compatible imports.
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
