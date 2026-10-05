// Moved to the shared package — re-exported for backwards-compatible imports.
export {
  useSocketStore,
  useSocketConnection,
  selectIsSocketConnected,
  selectSocketError,
  selectReconnectAttempts,
} from "@nordi/shared/store/socket.store";
