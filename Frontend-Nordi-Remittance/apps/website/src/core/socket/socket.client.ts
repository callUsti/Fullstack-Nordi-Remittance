// Moved to the shared package — re-exported for backwards-compatible imports.
export {
  connectSocket,
  disconnectSocket,
  getSocket,
  isSocketConnected,
  onSocketEvent,
  emitSocketEvent,
  configureSocket,
} from "@nordi/shared/core/socket/socket.client";
