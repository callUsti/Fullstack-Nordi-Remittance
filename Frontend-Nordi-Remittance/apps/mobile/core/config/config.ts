import Constants from "expo-constants";
import { Platform } from "react-native";

const PRODUCTION_API_URL =
  process.env.EXPO_PUBLIC_PROD_API_URL ||
  "https://api.nordi-remittance.com/api/v1";
const DEVELOPMENT_API_PATH = "/api/v1";
const DEVELOPMENT_API_PORT = 3000;
// Default LAN IP of development workstation for physical device fallback
const DEFAULT_DEV_HOST = "192.168.10.164";

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Extracts the development host (IP / domain) from Expo runtime metadata across
 * Expo Go, Dev Client, and various SDK versions (SDK 49 - 52).
 */
export function getDevelopmentHost(): string | undefined {
  // 1. Constants.expoConfig?.hostUri (Standard Expo SDK 49+)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.replace(/:\d+$/, "").trim();
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return host;
    }
  }

  // 2. Constants.manifest2?.extra?.expoGo?.debuggerHost (Expo Go SDK 49+)
  const debuggerHost = (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost;
  if (typeof debuggerHost === "string" && debuggerHost.trim()) {
    const host = debuggerHost.replace(/:\d+$/, "").trim();
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return host;
    }
  }

  // 3. Constants.manifest?.debuggerHost (Classic manifest)
  const legacyDebuggerHost = (Constants.manifest as any)?.debuggerHost;
  if (typeof legacyDebuggerHost === "string" && legacyDebuggerHost.trim()) {
    const host = legacyDebuggerHost.replace(/:\d+$/, "").trim();
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return host;
    }
  }

  // 4. Constants.experienceUrl (e.g. exp://192.168.10.164:8081)
  const experienceUrl = (Constants as any)?.experienceUrl;
  if (typeof experienceUrl === "string") {
    const match = experienceUrl.match(/:\/\/([^:/]+)/);
    if (match && match[1] && match[1] !== "localhost" && match[1] !== "127.0.0.1") {
      return match[1];
    }
  }

  // 5. Constants.linkingUri
  const linkingUri = (Constants as any)?.linkingUri;
  if (typeof linkingUri === "string") {
    const match = linkingUri.match(/:\/\/([^:/]+)/);
    if (match && match[1] && match[1] !== "localhost" && match[1] !== "127.0.0.1") {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Adapts URLs containing localhost/127.0.0.1 so that physical devices and
 * emulators can actually reach the local dev server.
 */
function resolveUrlForPlatform(rawUrl: string): string {
  const normalized = normalizeUrl(rawUrl);

  const hasLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(normalized);
  if (!hasLocalhost) {
    return normalized;
  }

  // Android emulator routes to host machine via 10.0.2.2
  if (Platform.OS === "android" && !Constants.isDevice) {
    return normalized.replace(/localhost|127\.0\.0\.1/i, "10.0.2.2");
  }

  // Physical devices (iOS or Android) cannot reach 'localhost' on the device itself
  if (Constants.isDevice || Platform.OS === "android") {
    const host = getDevelopmentHost() || DEFAULT_DEV_HOST;
    return normalized.replace(/localhost|127\.0\.0\.1/i, host);
  }

  return normalized;
}

function getApiUrl(): string {
  // Check configured env variables
  const configuredUrl =
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    process.env.API_URL?.trim();

  if (configuredUrl) {
    return resolveUrlForPlatform(configuredUrl);
  }

  // Web platform in browser
  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (!__DEV__) {
      return PRODUCTION_API_URL;
    }
    const protocol = window.location.protocol === "https:" ? "https" : "http";
    return `${protocol}://${window.location.hostname}:${DEVELOPMENT_API_PORT}${DEVELOPMENT_API_PATH}`;
  }

  // Android emulator without physical device flag
  if (__DEV__ && Platform.OS === "android" && !Constants.isDevice) {
    return `http://10.0.2.2:${DEVELOPMENT_API_PORT}${DEVELOPMENT_API_PATH}`;
  }

  if (__DEV__) {
    const host = getDevelopmentHost() || DEFAULT_DEV_HOST;
    if (host) {
      return `http://${host}:${DEVELOPMENT_API_PORT}${DEVELOPMENT_API_PATH}`;
    }

    if (Platform.OS === "ios" && !Constants.isDevice) {
      return `http://localhost:${DEVELOPMENT_API_PORT}${DEVELOPMENT_API_PATH}`;
    }
  }

  return PRODUCTION_API_URL;
}

export const API_URL = getApiUrl();

function getWebSocketUrl(): string {
  const configuredUrl =
    process.env.EXPO_PUBLIC_WS_URL?.trim() ||
    process.env.WS_URL?.trim();

  if (configuredUrl) {
    return resolveUrlForPlatform(configuredUrl);
  }

  return API_URL.replace(/\/api(?:\/v\d+)?$/i, "");
}

export const WS_URL = getWebSocketUrl();

if (__DEV__) {
  console.log(`[Nordi Mobile] Configured API Base URL: ${API_URL}`);
  console.log(`[Nordi Mobile] Configured WebSocket URL: ${WS_URL}`);
}
