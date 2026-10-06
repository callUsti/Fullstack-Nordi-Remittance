import Constants from "expo-constants";
import { Platform } from "react-native";

const PRODUCTION_API_URL = "https://notes-brainbox.onrender.com/api";
const DEVELOPMENT_API_PATH = "/api/v1";
const DEVELOPMENT_API_PORT = 3000;

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function getDevelopmentHost(): string | undefined {
  return Constants.expoConfig?.hostUri?.replace(/:\d+$/, "");
}

function getApiUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (!__DEV__) {
      return PRODUCTION_API_URL;
    }

    const protocol = window.location.protocol === "https:" ? "https" : "http";
    return `${protocol}://${window.location.hostname}:${DEVELOPMENT_API_PORT}${DEVELOPMENT_API_PATH}`;
  }

  if (__DEV__ && Platform.OS === "android" && !Constants.isDevice) {
    return `http://10.0.2.2:${DEVELOPMENT_API_PORT}${DEVELOPMENT_API_PATH}`;
  }

  if (__DEV__) {
    const host = getDevelopmentHost();
    if (host) {
      return `http://${host}:${DEVELOPMENT_API_PORT}${DEVELOPMENT_API_PATH}`;
    }

    if (Platform.OS === "ios") {
      return `http://localhost:${DEVELOPMENT_API_PORT}${DEVELOPMENT_API_PATH}`;
    }
  }

  return PRODUCTION_API_URL;
}

export const API_URL = getApiUrl();

function getWebSocketUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_WS_URL?.trim();
  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  return API_URL.replace(/\/api(?:\/v\d+)?$/i, "");
}

export const WS_URL = getWebSocketUrl();
