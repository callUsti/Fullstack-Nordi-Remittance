// ============================================================================
// API CLIENT - Axios instance with interceptors for authentication
//
// Platform-agnostic: works unmodified on web (Vite) and React Native (Expo).
// Token persistence, network reporting, and forced-logout are injected via
// `configureApiClient()` so this file never touches `localStorage`/`window`
// directly. Each app wires its platform adapters once at bootstrap:
//   apps/website/src/core/bootstrap.ts
//   apps/mobile/src/core/bootstrap.ts
// ============================================================================

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { KeyValueStorage, NetworkReporter, SessionGuard } from "../platform/types";
import { getDefaultStorage } from "../platform/storage";

// Token storage keys
const ACCESS_TOKEN_KEY = "remit_access_token";
const REFRESH_TOKEN_KEY = "remit_refresh_token";

// ============================================================================
// RUNTIME CONFIGURATION (set once per app at bootstrap)
// ============================================================================

const noopNetworkReporter: NetworkReporter = {
  isOnline: true,
  subscribe: () => () => {},
};

const noopSessionGuard: SessionGuard = {
  forceLogout: () => {},
};

interface ApiRuntimeConfig {
  baseURL: string;
  tokenStorage: KeyValueStorage;
  networkReporter: NetworkReporter;
  sessionGuard: SessionGuard;
}

const runtime: ApiRuntimeConfig = {
  baseURL: "http://localhost:3000/api/v1",
  tokenStorage: getDefaultStorage(),
  networkReporter: noopNetworkReporter,
  sessionGuard: noopSessionGuard,
};

/**
 * Wires platform-specific dependencies into the shared API client.
 * Safe to call multiple times (e.g. hot reload) — last call wins.
 */
export function configureApiClient(options: {
  baseURL?: string;
  tokenStorage?: KeyValueStorage;
  networkReporter?: NetworkReporter;
  sessionGuard?: SessionGuard;
}): void {
  if (options.baseURL) {
    runtime.baseURL = options.baseURL;
    apiClient.defaults.baseURL = options.baseURL;
  }
  if (options.tokenStorage) runtime.tokenStorage = options.tokenStorage;
  if (options.networkReporter) runtime.networkReporter = options.networkReporter;
  if (options.sessionGuard) runtime.sessionGuard = options.sessionGuard;
}

export function getApiBaseURL(): string {
  return runtime.baseURL;
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================
// In-memory cache keeps all getters synchronous (required by the axios
// interceptors below) while `hydrate()` lazily loads any persisted value
// from the configured storage adapter at app start.

let accessTokenCache: string | null = null;
let refreshTokenCache: string | null = null;
let hydrated = false;

export const TokenManager = {
  /** Loads any persisted tokens into the in-memory cache. Call once at app start. */
  async hydrate(): Promise<void> {
    const [access, refresh] = await Promise.all([
      Promise.resolve(runtime.tokenStorage.getItem(ACCESS_TOKEN_KEY)),
      Promise.resolve(runtime.tokenStorage.getItem(REFRESH_TOKEN_KEY)),
    ]);
    accessTokenCache = access;
    refreshTokenCache = refresh;
    hydrated = true;
  },

  getAccessToken: (): string | null => {
    if (!hydrated && !accessTokenCache) {
      // Best-effort synchronous read for sync storages (e.g. localStorage)
      const maybe = runtime.tokenStorage.getItem(ACCESS_TOKEN_KEY);
      if (typeof maybe === "string") {
        accessTokenCache = maybe;
      } else if (maybe === null) {
        accessTokenCache = null;
      }
    }
    return accessTokenCache;
  },

  getRefreshToken: (): string | null => {
    if (!hydrated && !refreshTokenCache) {
      const maybe = runtime.tokenStorage.getItem(REFRESH_TOKEN_KEY);
      if (typeof maybe === "string") {
        refreshTokenCache = maybe;
      } else if (maybe === null) {
        refreshTokenCache = null;
      }
    }
    return refreshTokenCache;
  },

  setTokens: (accessToken: string, refreshToken?: string): void => {
    accessTokenCache = accessToken;
    void runtime.tokenStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      refreshTokenCache = refreshToken;
      void runtime.tokenStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clearTokens: (): void => {
    accessTokenCache = null;
    refreshTokenCache = null;
    void runtime.tokenStorage.removeItem(ACCESS_TOKEN_KEY);
    void runtime.tokenStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!TokenManager.getAccessToken();
  },
};

// ============================================================================
// REQUEST ID — crypto.randomUUID isn't guaranteed on Hermes/older engines
// ============================================================================

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

const apiClient = axios.create({
  baseURL: runtime.baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ============================================================================
// REQUEST INTERCEPTOR - Attach token to all requests
// ============================================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only attach stored app JWT if the request doesn't already have an
    // explicit Authorization header. Clerk-sync calls pass a fresh Clerk
    // session token which must NOT be overwritten by a stale app JWT.
    if (config.headers && !config.headers.Authorization) {
      const token = TokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add request ID for tracking
    config.headers["X-Request-ID"] = generateRequestId();

    // Stamp request start time for latency tracking
    (config as any).__requestStartTime = Date.now();

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ============================================================================
// RESPONSE INTERCEPTOR - Handle token refresh and errors
// ============================================================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Report latency to NetworkDetector
    const startTime = (response.config as any).__requestStartTime;
    if (startTime) {
      runtime.networkReporter.reportLatency?.(Date.now() - startTime);
    }
    runtime.networkReporter.reportRequestSuccess?.();
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const requestUrl = originalRequest?.url || "";
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/verify") ||
      requestUrl.includes("/auth/resend") ||
      requestUrl.includes("/auth/clerk") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh");

    if (error.response?.status === 401 && isAuthEndpoint) {
      // Do NOT force logout or redirect to login on OTP/verification failures.
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = TokenManager.getRefreshToken();

      if (!refreshToken) {
        runtime.sessionGuard.forceLogout("token_expired");
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${runtime.baseURL}/auth/refresh`, {
          refreshToken,
        });

        // Backend wraps tokens as { data: { tokens: { accessToken, refreshToken } } }
        const refreshData = response.data?.data;
        const accessToken = refreshData?.tokens?.accessToken || refreshData?.accessToken;
        const newRefreshToken = refreshData?.tokens?.refreshToken || refreshData?.refreshToken;

        if (!accessToken) {
          throw new Error("No access token in refresh response");
        }

        TokenManager.setTokens(accessToken, newRefreshToken);

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        runtime.sessionGuard.forceLogout("token_expired");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Report network-level failures to the detector (no response = network error)
    if (!error.response && error.code !== "ERR_CANCELED") {
      runtime.networkReporter.reportNetworkError?.();
    }

    return Promise.reject(error);
  },
);

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  success: false;
  error?: {
    code?: string;
    message: string;
    details?: any;
  };
  message?: string; // Fallback
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    const responseData = axiosError.response?.data;

    // Check if the backend sent structured validation error details
    const backendError = responseData?.error;

    if (backendError) {
      // If there are specific validation details from mongoose or Zod
      if (backendError.details) {
        // Handle array format (e.g. from validators)
        if (Array.isArray(backendError.details)) {
          const detailMessages = backendError.details.map((err: any) => err.message).filter(Boolean);

          if (detailMessages.length > 0) {
            return detailMessages.join(", ");
          }
        }
        // Handle object format (e.g. Mongoose validation errors)
        else if (typeof backendError.details === "object") {
          const detailMessages = Object.values(backendError.details)
            .map((err: any) => err?.message || String(err))
            .filter(Boolean);

          if (detailMessages.length > 0) {
            return detailMessages.join(", ");
          }
        }
      }

      return backendError.message || "An unexpected error occurred";
    }

    return responseData?.message || axiosError.message || "An unexpected error occurred";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
};

// ============================================================================
// EXPORTS
// ============================================================================

export default apiClient;
