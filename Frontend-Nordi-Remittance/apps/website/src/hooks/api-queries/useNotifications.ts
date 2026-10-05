// Moved to the shared package — re-exported for backwards-compatible imports.
export {
  useNotifications,
  useNotification,
  useUnreadNotificationsCount,
  useUnreadNotifications,
  useNotificationPreferences,
  useMarkNotificationAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteAllReadNotifications,
  useUpdateNotificationPreferences,
  useRegisterPushToken,
  useUnregisterPushToken,
  useSendTestNotification,
} from "@nordi/shared/hooks/api-queries/useNotifications";
