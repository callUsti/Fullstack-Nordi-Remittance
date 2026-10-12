import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { Linking, Platform, Alert } from "react-native";
import { usePermissionStore } from "@/store/permission-store";

class PermissionHandler {
  /**
   * Check and request permission with a custom modal flow
   */
  async checkOrRequest(type: PermissionType): Promise<boolean> {
    const status = await this.checkStatus(type);

    if (status === "granted") {
      return true;
    }

    // specific check for blocked/denied where we can't ask again
    // In Expo, 'denied' usually means we can ask again unless it's strictly 'never_ask_again' (android)
    // But for simplicity, if not granted, we show our modal to explain WHY, then ask.

    return new Promise((resolve) => {
      const { showPermissionModal, hidePermissionModal } =
        usePermissionStore.getState();

      showPermissionModal(
        type,
        async () => {
          // On Confirm: Request Native Permission
          const newStatus = await this.requestNative(type);
          if (newStatus === "granted") {
            resolve(true);
          } else {
            // If still denied, it might be permanently denied -> Open Settings
            this.handleBlocked(type, resolve);
          }
        },
        () => {
          // On Cancel
          resolve(false);
        },
      );
    });
  }

  private async checkStatus(type: PermissionType): Promise<string> {
    try {
      switch (type) {
        case "camera":
          const cam = await ImagePicker.getCameraPermissionsAsync();
          return cam.status;
        case "photo":
          const photo = await ImagePicker.getMediaLibraryPermissionsAsync();
          return photo.status;
        case "location":
          const loc = await Location.getForegroundPermissionsAsync();
          return loc.status;
        case "microphone":
          const mic = await Audio.getPermissionsAsync();
          return mic.status;
        case "tracking":
          if (Platform.OS === "ios") {
            const tracking = await getTrackingPermissionsAsync();
            return tracking.status;
          }
          return "granted";
        case "notification":
          // Notifications usually handled by expo-notifications, simplistic check here or extend later
          return "granted";
        default:
          return "undetermined";
      }
    } catch (e) {
      console.warn("[PermissionHandler] Error checking status", e);
      return "undetermined";
    }
  }

  private async requestNative(type: PermissionType): Promise<string> {
    try {
      switch (type) {
        case "camera":
          const cam = await ImagePicker.requestCameraPermissionsAsync();
          return cam.status;
        case "photo":
          const photo = await ImagePicker.requestMediaLibraryPermissionsAsync();
          return photo.status;
        case "location":
          const loc = await Location.requestForegroundPermissionsAsync();
          return loc.status;
        case "microphone":
          const mic = await Audio.requestPermissionsAsync();
          return mic.status;
        case "tracking":
          if (Platform.OS === "ios") {
            const tracking = await requestTrackingPermissionsAsync();
            return tracking.status;
          }
          return "granted";
        default:
          return "denied";
      }
    } catch (e) {
      console.warn("[PermissionHandler] Error requesting permission", e);
      return "denied";
    }
  }

  private handleBlocked(type: PermissionType, resolve: (val: boolean) => void) {
    const { showPermissionModal } = usePermissionStore.getState();
    // Show modal again but with "Open Settings" intent
    showPermissionModal(
      type,
      () => {
        Linking.openSettings();
        resolve(false); // We can't verify return from settings immediately
      },
      () => resolve(false),
      "Permission was denied. Please enable it in system settings to continue.",
    );
  }
}

export const permissionHandler = new PermissionHandler();