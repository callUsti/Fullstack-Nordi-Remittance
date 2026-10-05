// This module now lives in the shared package so it can be reused by both
// the website and the mobile app. Re-exported here so existing imports like
// `@core/api/client` keep working unchanged across the website codebase.
export {
  default,
  TokenManager,
  getErrorMessage,
  configureApiClient,
  getApiBaseURL,
} from "@nordi/shared/core/api/client";
export type { ApiResponse, PaginatedResponse, ApiError } from "@nordi/shared/core/api/client";
