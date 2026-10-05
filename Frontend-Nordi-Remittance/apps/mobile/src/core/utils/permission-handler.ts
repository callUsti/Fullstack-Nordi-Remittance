import * as ImagePicker from 'expo-image-picker';
import type { DevicePermissionStatus } from '@nordi/shared/store/permissions.store';
import { usePermissionsStore } from '@nordi/shared/store/permissions.store';

type ExpoPermission = {
  accessPrivileges?: string;
  canAskAgain: boolean;
  granted: boolean;
  status: string;
};

function toPermissionStatus(permission: ExpoPermission): DevicePermissionStatus {
  if (permission.granted) {
    return permission.accessPrivileges === 'limited' ? 'limited' : 'granted';
  }

  return permission.status === 'undetermined' ? 'undetermined' : 'denied';
}

function updatePermissionStatus(
  kind: 'camera' | 'mediaLibrary',
  permission: ExpoPermission,
): void {
  const store = usePermissionsStore.getState();
  store.setDevicePermissions(
    kind === 'camera' ? toPermissionStatus(permission) : store.cameraPermission,
    kind === 'mediaLibrary' ? toPermissionStatus(permission) : store.mediaLibraryPermission,
  );
}

let initialization: Promise<void> | null = null;

/** Reads current permissions without prompting, for app startup. */
export function initializeDevicePermissions(): Promise<void> {
  if (!initialization) {
    initialization = Promise.all([
      ImagePicker.getCameraPermissionsAsync(),
      ImagePicker.getMediaLibraryPermissionsAsync(),
    ])
      .then(([camera, mediaLibrary]) => {
        usePermissionsStore.getState().setDevicePermissions(
          toPermissionStatus(camera),
          toPermissionStatus(mediaLibrary),
        );
      })
      .catch((error: unknown) => {
        initialization = null;
        throw error;
      });
  }

  return initialization;
}

async function ensurePermission(kind: 'camera' | 'mediaLibrary'): Promise<boolean> {
  const getPermission =
    kind === 'camera'
      ? ImagePicker.getCameraPermissionsAsync
      : ImagePicker.getMediaLibraryPermissionsAsync;
  const requestPermission =
    kind === 'camera'
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

  let permission = await getPermission();
  if (!permission.granted && permission.canAskAgain) {
    permission = await requestPermission();
  }

  updatePermissionStatus(kind, permission);
  return permission.granted;
}

/** Requests camera access only when the user chooses to take a photo. */
export function ensureCameraPermission(): Promise<boolean> {
  return ensurePermission('camera');
}

/** Requests photo-library access only when the user chooses to browse photos. */
export function ensureMediaLibraryPermission(): Promise<boolean> {
  return ensurePermission('mediaLibrary');
}